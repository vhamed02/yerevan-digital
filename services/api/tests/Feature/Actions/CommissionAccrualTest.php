<?php

namespace Tests\Feature\Actions;

use App\Actions\HandlePaymentSuccessAction;
use App\Enums\CommissionType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Commission;
use App\Models\Order;
use App\Services\CommissionService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class CommissionAccrualTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        config(['commission.default_rate' => '0.05']);
    }

    public function test_paying_an_order_accrues_commission(): void
    {
        $order = Order::factory()->create([
            'subtotal'       => 20000,
            'total'          => 20000,
            'status'         => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
        ]);

        app(HandlePaymentSuccessAction::class)->execute($order, 'idram');

        $commission = Commission::where('order_id', $order->id)->sole();

        $this->assertSame(CommissionType::Accrual, $commission->type);
        $this->assertSame('1000.00', $commission->amount);
        $this->assertSame($order->store_id, $commission->store_id);
    }

    public function test_a_replayed_gateway_callback_does_not_double_charge(): void
    {
        $order = Order::factory()->create([
            'subtotal'       => 20000,
            'total'          => 20000,
            'status'         => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
        ]);

        $action = app(HandlePaymentSuccessAction::class);
        $action->execute($order, 'idram');
        $action->execute($order->fresh(), 'idram');

        $this->assertSame(1, Commission::where('order_id', $order->id)->count());
        $this->assertSame(1000.0, (float) Commission::where('order_id', $order->id)->sum('amount'));
    }

    /**
     * The reason this engine lives in Laravel rather than a separate service:
     * the order can never be marked paid unless its commission lands with it.
     */
    public function test_order_is_not_marked_paid_when_the_commission_write_fails(): void
    {
        $order = Order::factory()->create([
            'status'         => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
        ]);

        $this->mock(CommissionService::class)
            ->shouldReceive('accrue')
            ->once()
            ->andThrow(new RuntimeException('ledger unavailable'));

        try {
            app(HandlePaymentSuccessAction::class)->execute($order, 'idram');
            $this->fail('Expected the ledger failure to propagate.');
        } catch (RuntimeException $e) {
            $this->assertSame('ledger unavailable', $e->getMessage());
        }

        $fresh = $order->fresh();
        $this->assertSame(PaymentStatus::Pending, $fresh->payment_status);
        $this->assertSame(OrderStatus::Pending, $fresh->status);
        $this->assertNull($fresh->paid_at);
    }
}
