<?php

namespace Tests\Feature\Customer;

use App\Enums\ProductStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerOrderTest extends TestCase
{
    use RefreshDatabase;

    private User  $customer;
    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->customer = User::factory()->create(['role' => UserRole::Customer]);
        $this->customer->assignRole('customer');

        $this->store = Store::factory()->create(['status' => StoreStatus::Active]);
    }

    private function actingAsCustomer(): static
    {
        return $this->actingAs($this->customer, 'sanctum');
    }

    public function test_customer_lists_only_their_own_orders(): void
    {
        Order::factory()->count(2)->create([
            'store_id'    => $this->store->id,
            'customer_id' => $this->customer->id,
        ]);

        $other = User::factory()->create(['role' => UserRole::Customer]);
        Order::factory()->create([
            'store_id'    => $this->store->id,
            'customer_id' => $other->id,
        ]);

        $this->actingAsCustomer()
            ->getJson('/api/v1/customer/orders')
            ->assertOk()
            ->assertJsonCount(2, 'data.data')
            ->assertJsonStructure(['data' => ['data', 'meta' => ['current_page', 'total']]]);
    }

    public function test_customer_can_view_own_order_detail(): void
    {
        $order = Order::factory()->create([
            'store_id'    => $this->store->id,
            'customer_id' => $this->customer->id,
        ]);

        $this->actingAsCustomer()
            ->getJson("/api/v1/customer/orders/{$order->uuid}")
            ->assertOk()
            ->assertJsonPath('data.uuid', $order->uuid)
            ->assertJsonPath('data.order_number', $order->order_number)
            ->assertJsonStructure(['data' => ['store' => ['slug', 'name']]]);
    }

    public function test_customer_cannot_view_another_customers_order(): void
    {
        $other = User::factory()->create(['role' => UserRole::Customer]);
        $order = Order::factory()->create([
            'store_id'    => $this->store->id,
            'customer_id' => $other->id,
        ]);

        $this->actingAsCustomer()
            ->getJson("/api/v1/customer/orders/{$order->uuid}")
            ->assertNotFound();
    }

    public function test_customer_orders_require_authentication(): void
    {
        $this->getJson('/api/v1/customer/orders')->assertUnauthorized();
    }

    public function test_authenticated_checkout_links_order_to_customer(): void
    {
        $product = Product::factory()->create([
            'store_id'     => $this->store->id,
            'status'       => ProductStatus::Active,
            'price'        => 15000,
            'stock'        => 10,
            'manage_stock' => true,
        ]);

        $this->actingAsCustomer()
            ->postJson("/api/v1/store/{$this->store->slug}/checkout", [
                'full_name'      => 'Davit Sargsyan',
                'email'          => 'davit@example.com',
                'phone'          => '+37491000000',
                'address'        => 'Baghramyan Ave 1',
                'city'           => 'Yerevan',
                'postal_code'    => '0001',
                'country'        => 'Armenia',
                'payment_method' => 'idram',
                'items'          => [
                    ['product_id' => $product->uuid, 'variant_id' => null, 'quantity' => 1],
                ],
            ])
            ->assertCreated();

        $this->assertDatabaseHas('orders', [
            'store_id'    => $this->store->id,
            'customer_id' => $this->customer->id,
        ]);
    }

    public function test_guest_checkout_leaves_customer_id_null(): void
    {
        $product = Product::factory()->create([
            'store_id'     => $this->store->id,
            'status'       => ProductStatus::Active,
            'price'        => 15000,
            'stock'        => 10,
            'manage_stock' => true,
        ]);

        $this->postJson("/api/v1/store/{$this->store->slug}/checkout", [
            'full_name'      => 'Guest Buyer',
            'email'          => 'guest@example.com',
            'address'        => 'Baghramyan Ave 1',
            'city'           => 'Yerevan',
            'country'        => 'Armenia',
            'payment_method' => 'idram',
            'items'          => [
                ['product_id' => $product->uuid, 'variant_id' => null, 'quantity' => 1],
            ],
        ])->assertCreated();

        $this->assertDatabaseHas('orders', [
            'customer_email' => 'guest@example.com',
            'customer_id'    => null,
        ]);
    }
}
