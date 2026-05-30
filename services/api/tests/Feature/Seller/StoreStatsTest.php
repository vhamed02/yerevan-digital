<?php

namespace Tests\Feature\Seller;

use App\Enums\OrderStatus;
use App\Enums\ProductStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreStatsTest extends TestCase
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
        $this->store = Store::factory()->create(['user_id' => $this->seller->id, 'currency' => 'AMD']);
    }

    private function actingAsSeller(): static
    {
        return $this->actingAs($this->seller, 'sanctum');
    }

    public function test_store_stats_returns_expected_structure(): void
    {
        $this->actingAsSeller()
            ->getJson('/api/v1/seller/store/stats')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'products' => ['total', 'active', 'draft', 'archived'],
                    'orders'   => ['total', 'pending', 'processing', 'shipped', 'today'],
                    'revenue'  => ['total', 'this_month', 'today', 'currency'],
                ],
            ]);
    }

    public function test_store_stats_computes_product_breakdown(): void
    {
        Product::factory()->count(3)->create(['store_id' => $this->store->id, 'status' => ProductStatus::Active]);
        Product::factory()->count(2)->create(['store_id' => $this->store->id, 'status' => ProductStatus::Draft]);
        Product::factory()->create(['store_id' => $this->store->id, 'status' => ProductStatus::Archived]);

        $res = $this->actingAsSeller()->getJson('/api/v1/seller/store/stats')->assertOk();

        $this->assertEquals(6, $res->json('data.products.total'));
        $this->assertEquals(3, $res->json('data.products.active'));
        $this->assertEquals(2, $res->json('data.products.draft'));
        $this->assertEquals(1, $res->json('data.products.archived'));
    }

    public function test_store_stats_computes_order_and_revenue_totals(): void
    {
        Order::factory()->count(2)->create([
            'store_id' => $this->store->id,
            'status'   => OrderStatus::Pending,
            'total'    => 1000,
        ]);
        Order::factory()->create([
            'store_id' => $this->store->id,
            'status'   => OrderStatus::Shipped,
            'total'    => 5000,
        ]);

        $res = $this->actingAsSeller()->getJson('/api/v1/seller/store/stats')->assertOk();

        $this->assertEquals(3, $res->json('data.orders.total'));
        $this->assertEquals(2, $res->json('data.orders.pending'));
        $this->assertEquals(1, $res->json('data.orders.shipped'));
        $this->assertEquals(3, $res->json('data.orders.today'));
        $this->assertEquals(7000, $res->json('data.revenue.total'));
        $this->assertEquals(7000, $res->json('data.revenue.today'));
        $this->assertEquals('AMD', $res->json('data.revenue.currency'));
    }

    public function test_store_stats_scopes_to_own_store_only(): void
    {
        $other = Store::factory()->create();
        Product::factory()->count(5)->create(['store_id' => $other->id, 'status' => ProductStatus::Active]);
        Order::factory()->count(4)->create(['store_id' => $other->id, 'total' => 9999]);

        $res = $this->actingAsSeller()->getJson('/api/v1/seller/store/stats')->assertOk();

        $this->assertEquals(0, $res->json('data.products.total'));
        $this->assertEquals(0, $res->json('data.orders.total'));
        $this->assertEquals(0.0, $res->json('data.revenue.total'));
    }
}
