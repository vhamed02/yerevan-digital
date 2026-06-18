<?php

namespace Tests\Feature\Store;

use App\Enums\StoreStatus;
use App\Models\Order;
use App\Models\Store;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTrackingTest extends TestCase
{
    use RefreshDatabase;

    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $store = Store::factory()->create(['status' => StoreStatus::Active]);
        $this->order = Order::factory()->create([
            'store_id'       => $store->id,
            'customer_email' => 'buyer@example.com',
        ]);
    }

    public function test_guest_can_track_order_with_correct_number_and_email(): void
    {
        $this->postJson('/api/v1/orders/track', [
            'order_number' => $this->order->order_number,
            'email'        => 'buyer@example.com',
        ])->assertOk()
            ->assertJsonPath('data.order_number', $this->order->order_number)
            ->assertJsonStructure(['data' => ['status', 'total', 'store' => ['slug']]]);
    }

    public function test_tracking_is_case_insensitive_on_email(): void
    {
        $this->postJson('/api/v1/orders/track', [
            'order_number' => $this->order->order_number,
            'email'        => 'BUYER@EXAMPLE.COM',
        ])->assertOk()
            ->assertJsonPath('data.order_number', $this->order->order_number);
    }

    public function test_tracking_fails_with_wrong_email(): void
    {
        $this->postJson('/api/v1/orders/track', [
            'order_number' => $this->order->order_number,
            'email'        => 'someone-else@example.com',
        ])->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_tracking_fails_with_unknown_order_number(): void
    {
        $this->postJson('/api/v1/orders/track', [
            'order_number' => 'VEND-2026-99999',
            'email'        => 'buyer@example.com',
        ])->assertNotFound();
    }

    public function test_tracking_validates_input(): void
    {
        $this->postJson('/api/v1/orders/track', [])
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['order_number', 'email']]);
    }
}
