<?php

namespace Tests\Feature\Services;

use App\Enums\CommissionType;
use App\Enums\InvoiceStatus;
use App\Models\Commission;
use App\Models\CommissionInvoice;
use App\Models\Order;
use App\Models\Store;
use App\Services\CommissionInvoiceService;
use Carbon\CarbonInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommissionInvoiceServiceTest extends TestCase
{
    use RefreshDatabase;

    private CommissionInvoiceService $service;
    private Store $store;
    private CarbonInterface $start;
    private CarbonInterface $end;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->service = app(CommissionInvoiceService::class);
        $this->store   = Store::factory()->create();
        $this->start   = now()->startOfWeek()->subWeek();
        $this->end     = $this->start->copy()->addWeek();
    }

    /** Ledger rows are timestamped independently of `created()`, so the window is exact. */
    private function ledgerRow(int $storeId, string $amount, CommissionType $type, ?CarbonInterface $at = null): Commission
    {
        $order = Order::factory()->create(['store_id' => $storeId]);

        $commission = Commission::factory()->create([
            'store_id' => $storeId,
            'order_id' => $order->id,
            'type'     => $type,
            'amount'   => $amount,
        ]);

        $commission->forceFill(['created_at' => $at ?? $this->start->copy()->addDay()])->save();

        return $commission;
    }

    public function test_generates_an_invoice_for_the_net_commission_in_the_window(): void
    {
        $this->ledgerRow($this->store->id, '500.00', CommissionType::Accrual);
        $this->ledgerRow($this->store->id, '250.00', CommissionType::Accrual);

        $invoices = $this->service->generateForPeriod($this->start, $this->end);

        $this->assertCount(1, $invoices);
        $invoice = $invoices->first();
        $this->assertSame('750.00', $invoice->amount);
        $this->assertSame($this->store->id, $invoice->store_id);
        $this->assertTrue($this->start->isSameDay($invoice->period_start));
        $this->assertTrue($this->end->isSameDay($invoice->period_end));
        $this->assertEquals(InvoiceStatus::Pending, $invoice->status);
    }

    public function test_a_reversal_in_window_reduces_the_invoiced_amount(): void
    {
        $this->ledgerRow($this->store->id, '1000.00', CommissionType::Accrual);
        $this->ledgerRow($this->store->id, '-400.00', CommissionType::Reversal);

        $invoices = $this->service->generateForPeriod($this->start, $this->end);

        $this->assertSame('600.00', $invoices->first()->amount);
    }

    public function test_net_at_or_below_zero_creates_no_invoice(): void
    {
        $this->ledgerRow($this->store->id, '300.00', CommissionType::Accrual);
        $this->ledgerRow($this->store->id, '-300.00', CommissionType::Reversal);

        $invoices = $this->service->generateForPeriod($this->start, $this->end);

        $this->assertCount(0, $invoices);
        $this->assertSame(0, CommissionInvoice::count());
    }

    public function test_commissions_outside_the_window_are_excluded(): void
    {
        $this->ledgerRow($this->store->id, '500.00', CommissionType::Accrual, $this->start->copy()->subDay());
        $this->ledgerRow($this->store->id, '200.00', CommissionType::Accrual, $this->end->copy());

        $invoices = $this->service->generateForPeriod($this->start, $this->end);

        $this->assertCount(0, $invoices);
    }

    public function test_rerunning_the_same_period_creates_nothing(): void
    {
        $this->ledgerRow($this->store->id, '500.00', CommissionType::Accrual);

        $first  = $this->service->generateForPeriod($this->start, $this->end);
        $second = $this->service->generateForPeriod($this->start, $this->end);

        $this->assertCount(1, $first);
        $this->assertCount(0, $second);
        $this->assertSame(1, CommissionInvoice::count());
    }

    public function test_store_slug_filter_limits_generation_to_one_store(): void
    {
        $other = Store::factory()->create();
        $this->ledgerRow($this->store->id, '500.00', CommissionType::Accrual);
        $this->ledgerRow($other->id, '900.00', CommissionType::Accrual);

        $invoices = $this->service->generateForPeriod($this->start, $this->end, $this->store->slug);

        $this->assertCount(1, $invoices);
        $this->assertSame($this->store->id, $invoices->first()->store_id);
    }

    public function test_outstanding_for_sums_only_unpaid_invoices(): void
    {
        CommissionInvoice::factory()->create(['store_id' => $this->store->id, 'amount' => '500.00']);
        CommissionInvoice::factory()->create(['store_id' => $this->store->id, 'amount' => '300.00', 'period_start' => $this->start->copy()->subWeek()]);
        CommissionInvoice::factory()->paid()->create(['store_id' => $this->store->id, 'amount' => '1000.00', 'period_start' => $this->start->copy()->subWeeks(2)]);
        CommissionInvoice::factory()->void()->create(['store_id' => $this->store->id, 'amount' => '200.00', 'period_start' => $this->start->copy()->subWeeks(3)]);

        $this->assertSame('800.00', $this->service->outstandingFor($this->store->id));
    }
}
