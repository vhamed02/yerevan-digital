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

class SellerDashboardTest extends TestCase
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

    public function test_dashboard_returns_expected_structure(): void
    {
        $this->actingAsSeller()
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'stats' => [
                        'total_products', 'active_products',
                        'total_orders', 'orders_this_month',
                        'revenue_this_month', 'revenue_today',
                    ],
                    'revenue_chart'    => [['date', 'revenue']],
                    'orders_by_status',
                    'recent_orders',
                ],
            ]);
    }

    public function test_stats_count_own_store_only(): void
    {
        Product::factory()->count(3)->create(['store_id' => $this->store->id, 'status' => ProductStatus::Active]);
        Product::factory()->draft()->create(['store_id' => $this->store->id]);

        $other = Store::factory()->create();
        Product::factory()->count(5)->create(['store_id' => $other->id, 'status' => ProductStatus::Active]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk();

        $this->assertEquals(4, $response->json('data.stats.total_products'));
        $this->assertEquals(3, $response->json('data.stats.active_products'));
    }

    public function test_stats_count_orders_correctly(): void
    {
        Order::factory()->count(3)->create(['store_id' => $this->store->id]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk();

        $this->assertEquals(3, $response->json('data.stats.total_orders'));
    }

    public function test_revenue_chart_returns_14_days(): void
    {
        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk();

        $this->assertCount(14, $response->json('data.revenue_chart'));
    }

    public function test_orders_by_status_groups_correctly(): void
    {
        Order::factory()->count(2)->create(['store_id' => $this->store->id, 'status' => OrderStatus::Pending]);
        Order::factory()->create(['store_id' => $this->store->id, 'status' => OrderStatus::Shipped]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk();

        $byStatus = collect($response->json('data.orders_by_status'))->keyBy('status');
        $this->assertEquals(2, $byStatus['pending']['count']);
        $this->assertEquals(1, $byStatus['shipped']['count']);
    }

    public function test_recent_orders_capped_at_five(): void
    {
        Order::factory()->count(8)->create(['store_id' => $this->store->id]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk();

        $this->assertCount(5, $response->json('data.recent_orders'));
    }

    public function test_unauthenticated_cannot_access_dashboard(): void
    {
        $this->getJson('/api/v1/seller/dashboard')->assertStatus(401);
    }
}
