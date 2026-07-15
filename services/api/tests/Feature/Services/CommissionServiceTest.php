<?php

namespace Tests\Feature\Services;

use App\Enums\CommissionType;
use App\Models\Commission;
use App\Models\Order;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Services\CommissionService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommissionServiceTest extends TestCase
{
    use RefreshDatabase;

    private CommissionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        $this->service = app(CommissionService::class);
        config(['commission.default_rate' => '0.05']);
    }

    public function test_calculates_commission_at_the_effective_rate(): void
    {
        $order = Order::factory()->create(['subtotal' => 15000, 'discount' => 0, 'total' => 15000]);

        $commission = $this->service->accrue($order);

        $this->assertSame('750.00', $commission->amount);
        $this->assertSame('0.0500', $commission->rate);
        $this->assertSame('15000.00', $commission->base_amount);
    }

    public function test_rounds_exact_half_units_up_rather_than_down(): void
    {
        // 100.10 * 0.05 = 5.005 exactly. Naive float maths yields 5.00 here,
        // because 5.005 is not representable in binary floating point.
        $this->assertSame('5.01', $this->service->calculate('100.10', '0.05'));
    }

    public function test_rounds_below_half_units_down(): void
    {
        // 0.04 * 0.05 = 0.002
        $this->assertSame('0.00', $this->service->calculate('0.04', '0.05'));
    }

    public function test_base_excludes_shipping_and_tax_and_subtracts_discount(): void
    {
        $order = Order::factory()->create([
            'subtotal'      => 10000,
            'discount'      => 1000,
            'shipping_cost' => 2000,
            'tax'           => 500,
            'total'         => 11500,
        ]);

        // Base is 10000 - 1000 = 9000, not the 11500 total.
        $this->assertSame('9000.00', $this->service->baseFor($order));
        $this->assertSame('450.00', $this->service->accrue($order)->amount);
    }

    public function test_base_never_goes_negative_when_discount_exceeds_subtotal(): void
    {
        $order = Order::factory()->create(['subtotal' => 100, 'discount' => 500, 'total' => 0]);

        $this->assertSame('0.00', $this->service->baseFor($order));
        $this->assertSame('0.00', $this->service->accrue($order)->amount);
    }

    public function test_store_rate_overrides_platform_default(): void
    {
        $store = Store::factory()->create(['commission_rate' => '0.0250']);

        $this->assertSame('0.0250', $this->service->rateFor($store->id));
    }

    public function test_platform_setting_overrides_config_default(): void
    {
        StoreSetting::create(['store_id' => null, 'key' => 'commission_rate', 'value' => '0.03']);
        $store = Store::factory()->create(['commission_rate' => null]);

        $this->assertSame('0.03', $this->service->rateFor($store->id));
    }

    public function test_falls_back_to_config_default_when_nothing_is_set(): void
    {
        config(['commission.default_rate' => '0.07']);
        $store = Store::factory()->create(['commission_rate' => null]);

        $this->assertSame('0.07', $this->service->rateFor($store->id));
    }

    public function test_ignores_an_out_of_range_platform_setting(): void
    {
        StoreSetting::create(['store_id' => null, 'key' => 'commission_rate', 'value' => '17']);
        $store = Store::factory()->create(['commission_rate' => null]);

        $this->assertSame('0.05', $this->service->rateFor($store->id));
    }

    public function test_accrual_is_idempotent_per_order(): void
    {
        $order = Order::factory()->create(['subtotal' => 15000, 'total' => 15000]);

        $first  = $this->service->accrue($order);
        $second = $this->service->accrue($order);

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, Commission::where('order_id', $order->id)->count());
    }

    public function test_reversal_mirrors_the_accrual_and_nets_to_zero(): void
    {
        $order   = Order::factory()->create(['subtotal' => 15000, 'total' => 15000]);
        $accrual = $this->service->accrue($order);

        $reversal = $this->service->reverse($order, 'order_cancelled');

        $this->assertSame('-750.00', $reversal->amount);
        $this->assertSame($accrual->rate, $reversal->rate);
        $this->assertSame(CommissionType::Reversal, $reversal->type);
        $this->assertSame('order_cancelled', $reversal->reason);
        $this->assertSame(0.0, (float) Commission::where('order_id', $order->id)->sum('amount'));
    }

    public function test_reversal_is_a_no_op_when_no_commission_was_accrued(): void
    {
        $order = Order::factory()->create();

        $this->assertNull($this->service->reverse($order, 'order_cancelled'));
        $this->assertSame(0, Commission::where('order_id', $order->id)->count());
    }

    public function test_reversal_is_idempotent_per_order(): void
    {
        $order = Order::factory()->create(['subtotal' => 15000, 'total' => 15000]);
        $this->service->accrue($order);

        $first  = $this->service->reverse($order, 'order_cancelled');
        $second = $this->service->reverse($order, 'order_refunded');

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, Commission::where('order_id', $order->id)
            ->where('type', CommissionType::Reversal)->count());
    }

    public function test_rate_is_snapshotted_so_later_rate_changes_do_not_rewrite_history(): void
    {
        $store = Store::factory()->create(['commission_rate' => '0.1000']);
        $order = Order::factory()->create(['store_id' => $store->id, 'subtotal' => 10000, 'total' => 10000]);

        $commission = $this->service->accrue($order);
        $store->update(['commission_rate' => '0.0100']);

        $this->assertSame('0.1000', $commission->fresh()->rate);
        $this->assertSame('1000.00', $commission->fresh()->amount);
    }
}
