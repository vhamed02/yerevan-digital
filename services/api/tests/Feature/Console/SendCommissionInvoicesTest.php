<?php

namespace Tests\Feature\Console;

use App\Enums\CommissionType;
use App\Models\Commission;
use App\Models\CommissionInvoice;
use App\Models\Order;
use App\Models\Store;
use App\Notifications\CommissionInvoiceNotification;
use Carbon\CarbonInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SendCommissionInvoicesTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;
    private CarbonInterface $start;
    private CarbonInterface $end;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->store = Store::factory()->create();
        $this->start = now()->startOfWeek()->subWeek();
        $this->end   = $this->start->copy()->addWeek();
    }

    private function ledgerRow(int $storeId, string $amount, ?CarbonInterface $at = null): Commission
    {
        $order = Order::factory()->create(['store_id' => $storeId]);

        $commission = Commission::factory()->create([
            'store_id' => $storeId,
            'order_id' => $order->id,
            'type'     => CommissionType::Accrual,
            'amount'   => $amount,
        ]);

        $commission->forceFill(['created_at' => $at ?? $this->start->copy()->addDay()])->save();

        return $commission;
    }

    public function test_dry_run_persists_and_sends_nothing(): void
    {
        Notification::fake();
        $this->ledgerRow($this->store->id, '500.00');

        $this->artisan('invoices:commission', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(0, CommissionInvoice::count());
        Notification::assertNothingSent();
    }

    public function test_real_run_creates_invoices_and_notifies_the_seller(): void
    {
        Notification::fake();
        $this->ledgerRow($this->store->id, '500.00');

        $this->artisan('invoices:commission')->assertSuccessful();

        $invoice = CommissionInvoice::sole();
        $this->assertSame($this->store->id, $invoice->store_id);
        $this->assertSame('500.00', $invoice->amount);

        Notification::assertSentTo($this->store->owner, CommissionInvoiceNotification::class);
    }

    public function test_no_mail_option_persists_but_does_not_notify(): void
    {
        Notification::fake();
        $this->ledgerRow($this->store->id, '500.00');

        $this->artisan('invoices:commission', ['--no-mail' => true])->assertSuccessful();

        $this->assertSame(1, CommissionInvoice::count());
        Notification::assertNothingSent();
    }

    public function test_store_option_limits_generation_and_mail_to_one_store(): void
    {
        Notification::fake();
        $other = Store::factory()->create();
        $this->ledgerRow($this->store->id, '500.00');
        $this->ledgerRow($other->id, '900.00');

        $this->artisan('invoices:commission', ['--store' => $this->store->slug])->assertSuccessful();

        $this->assertSame(1, CommissionInvoice::count());
        Notification::assertSentTo($this->store->owner, CommissionInvoiceNotification::class);
        Notification::assertNotSentTo($other->owner, CommissionInvoiceNotification::class);
    }

    public function test_period_start_option_backfills_an_older_week(): void
    {
        Notification::fake();
        $olderWeek = $this->start->copy()->subWeeks(3);
        $this->ledgerRow($this->store->id, '500.00', $olderWeek->copy()->addDay());

        $this->artisan('invoices:commission', ['--period-start' => $olderWeek->toDateString()])
            ->assertSuccessful();

        $invoice = CommissionInvoice::sole();
        $this->assertTrue($olderWeek->isSameDay($invoice->period_start));
    }
}
