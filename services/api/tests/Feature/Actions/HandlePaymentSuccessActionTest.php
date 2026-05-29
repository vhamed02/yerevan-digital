<?php

namespace Tests\Feature\Actions;

use App\Actions\HandlePaymentSuccessAction;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\PaymentSucceeded;
use App\Models\Order;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class HandlePaymentSuccessActionTest extends TestCase
{
    use RefreshDatabase;

    private HandlePaymentSuccessAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        $this->action = new HandlePaymentSuccessAction();
    }

    public function test_sets_status_to_processing_and_payment_to_paid(): void
    {
        $order = Order::factory()->create([
            'status'         => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
        ]);

        $result = $this->action->execute($order, 'idram');

        $this->assertEquals(OrderStatus::Processing, $result->status);
        $this->assertEquals(PaymentStatus::Paid, $result->payment_status);
    }

    public function test_sets_payment_method_and_paid_at(): void
    {
        $order = Order::factory()->create();

        $result = $this->action->execute($order, 'innecobank');

        $this->assertEquals('innecobank', $result->payment_method);
        $this->assertNotNull($result->paid_at);
    }

    public function test_persists_changes_to_database(): void
    {
        $order = Order::factory()->create([
            'status'         => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
        ]);

        $this->action->execute($order, 'converse_bank');

        $this->assertDatabaseHas('orders', [
            'id'             => $order->id,
            'status'         => OrderStatus::Processing->value,
            'payment_status' => PaymentStatus::Paid->value,
            'payment_method' => 'converse_bank',
        ]);
    }

    public function test_fires_payment_succeeded_event(): void
    {
        Event::fake([PaymentSucceeded::class]);

        $order = Order::factory()->create();

        $this->action->execute($order, 'idram');

        Event::assertDispatched(PaymentSucceeded::class, fn($e) => $e->order->id === $order->id);
    }

    public function test_returns_fresh_order_with_updated_attributes(): void
    {
        $order = Order::factory()->create([
            'status'         => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
        ]);

        $result = $this->action->execute($order, 'idram');

        $this->assertNotSame($order, $result);
        $this->assertEquals(PaymentStatus::Paid, $result->payment_status);
        $this->assertEquals(OrderStatus::Processing, $result->status);
    }
}
