<?php

namespace Tests\Feature\Seller;

use App\Enums\CommissionType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Commission;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Services\CommissionService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommissionReversalTest extends TestCase
{
    use RefreshDatabase;

    private User  $seller;
    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        config(['commission.default_rate' => '0.05']);

        $this->seller = User::factory()->seller()->create();
        $this->seller->assignRole('seller');
        $this->store = Store::factory()->create(['user_id' => $this->seller->id]);
    }

    private function paidOrder(): Order
    {
        $order = Order::factory()->create([
            'store_id'       => $this->store->id,
            'subtotal'       => 20000,
            'total'          => 20000,
            'status'         => OrderStatus::Processing,
            'payment_status' => PaymentStatus::Paid,
        ]);

        app(CommissionService::class)->accrue($order);

        return $order;
    }

    public function test_cancelling_a_paid_order_reverses_its_commission(): void
    {
        $order = $this->paidOrder();

        $this->actingAs($this->seller, 'sanctum')
            ->patchJson("/api/v1/seller/orders/{$order->uuid}/status", ['status' => 'cancelled'])
            ->assertOk();

        $reversal = Commission::where('order_id', $order->id)
            ->where('type', CommissionType::Reversal)
            ->sole();

        $this->assertSame('-1000.00', $reversal->amount);
        $this->assertSame('order_cancelled', $reversal->reason);
        $this->assertSame(0.0, (float) Commission::where('order_id', $order->id)->sum('amount'));
    }

    public function test_shipping_a_paid_order_leaves_its_commission_intact(): void
    {
        $order = $this->paidOrder();

        $this->actingAs($this->seller, 'sanctum')
            ->patchJson("/api/v1/seller/orders/{$order->uuid}/status", ['status' => 'shipped'])
            ->assertOk();

        $this->assertSame(1000.0, (float) Commission::where('order_id', $order->id)->sum('amount'));
        $this->assertSame(0, Commission::where('order_id', $order->id)
            ->where('type', CommissionType::Reversal)->count());
    }

    public function test_cancelling_an_unpaid_order_writes_no_reversal(): void
    {
        $order = Order::factory()->create([
            'store_id'       => $this->store->id,
            'status'         => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
        ]);

        $this->actingAs($this->seller, 'sanctum')
            ->patchJson("/api/v1/seller/orders/{$order->uuid}/status", ['status' => 'cancelled'])
            ->assertOk();

        $this->assertSame(0, Commission::where('order_id', $order->id)->count());
    }
}
