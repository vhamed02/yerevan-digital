<?php

namespace Tests\Feature\Seller;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Notifications\OrderStatusChangedNotification;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SellerOrderTest extends TestCase
{
    use RefreshDatabase;

    private User  $seller;
    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->seller = User::factory()->seller()->create();
        $this->seller->assignRole('seller');
        $this->store = Store::factory()->create(['user_id' => $this->seller->id]);
    }

    private function actingAsSeller(): static
    {
        return $this->actingAs($this->seller, 'sanctum');
    }

    public function test_seller_can_list_own_orders(): void
    {
        Order::factory()->count(3)->create(['store_id' => $this->store->id]);

        $other = Store::factory()->create();
        Order::factory()->count(2)->create(['store_id' => $other->id]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/orders')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => ['data' => [['id', 'uuid', 'order_number', 'status']], 'meta' => ['total']],
            ]);

        $this->assertEquals(3, $response->json('data.meta.total'));
    }

    public function test_seller_can_filter_orders_by_status(): void
    {
        Order::factory()->count(2)->create(['store_id' => $this->store->id, 'status' => OrderStatus::Pending]);
        Order::factory()->paid()->create(['store_id' => $this->store->id]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/orders?status=pending')
            ->assertOk();

        $this->assertEquals(2, $response->json('data.meta.total'));
    }

    public function test_seller_can_view_order_detail(): void
    {
        $order = Order::factory()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->getJson("/api/v1/seller/orders/{$order->uuid}")
            ->assertOk()
            ->assertJsonPath('data.uuid', $order->uuid)
            ->assertJsonStructure(['data' => ['uuid', 'status', 'items']]);
    }

    public function test_seller_cannot_view_another_stores_order(): void
    {
        $other = Store::factory()->create();
        $order = Order::factory()->create(['store_id' => $other->id]);

        $this->actingAsSeller()
            ->getJson("/api/v1/seller/orders/{$order->uuid}")
            ->assertStatus(404);
    }

    public function test_seller_can_cancel_pending_order(): void
    {
        Notification::fake();

        $order = Order::factory()->create([
            'store_id' => $this->store->id,
            'status'   => OrderStatus::Pending,
        ]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/orders/{$order->uuid}/status", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'cancelled']);
    }

    public function test_seller_can_move_paid_order_to_processing(): void
    {
        Notification::fake();

        $order = Order::factory()->paid()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/orders/{$order->uuid}/status", ['status' => 'processing'])
            ->assertOk()
            ->assertJsonPath('data.status', 'processing');
    }

    public function test_seller_can_ship_processing_order(): void
    {
        Notification::fake();

        $order = Order::factory()->processing()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/orders/{$order->uuid}/status", ['status' => 'shipped'])
            ->assertOk()
            ->assertJsonPath('data.status', 'shipped');

        $this->assertDatabaseHas('orders', [
            'id'     => $order->id,
            'status' => 'shipped',
        ]);

        $this->assertNotNull(Order::find($order->id)->shipped_at);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $order = Order::factory()->create([
            'store_id' => $this->store->id,
            'status'   => OrderStatus::Pending,
        ]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/orders/{$order->uuid}/status", ['status' => 'shipped'])
            ->assertStatus(422);
    }

    public function test_terminal_status_cannot_be_changed(): void
    {
        $order = Order::factory()->create([
            'store_id' => $this->store->id,
            'status'   => OrderStatus::Cancelled,
        ]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/orders/{$order->uuid}/status", ['status' => 'cancelled'])
            ->assertStatus(422);
    }

    public function test_status_update_notifies_customer_with_account(): void
    {
        Notification::fake();

        $customer = User::factory()->create();
        $order = Order::factory()->paid()->create([
            'store_id'    => $this->store->id,
            'customer_id' => $customer->id,
        ]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/orders/{$order->uuid}/status", ['status' => 'processing'])
            ->assertOk();

        Notification::assertSentTo($customer, OrderStatusChangedNotification::class);
    }

    public function test_seller_can_export_orders(): void
    {
        $this->actingAsSeller()
            ->getJson('/api/v1/seller/orders/export')
            ->assertOk()
            ->assertJsonStructure(['data' => ['job_id']]);
    }

    public function test_unauthenticated_cannot_access_orders(): void
    {
        $this->getJson('/api/v1/seller/orders')->assertStatus(401);
    }
}
