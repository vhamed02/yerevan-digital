<?php

namespace Tests\Feature\Seller;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerAnalyticsTest extends TestCase
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

    private function stats(): array
    {
        return $this->actingAs($this->seller, 'sanctum')
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk()
            ->json('data.stats');
    }

    private function paidOrder(array $attributes = []): Order
    {
        return Order::factory()->create([
            'store_id'       => $this->store->id,
            'status'         => OrderStatus::Processing,
            'payment_status' => PaymentStatus::Paid,
            'subtotal'       => 10000,
            'total'          => 10000,
            ...$attributes,
        ]);
    }

    public function test_revenue_ignores_unpaid_orders(): void
    {
        $this->paidOrder();
        Order::factory()->create([
            'store_id'       => $this->store->id,
            'status'         => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
            'total'          => 99999,
        ]);

        $stats = $this->stats();

        $this->assertEquals(10000.0, $stats['total_revenue']);
        $this->assertSame(1, $stats['paid_orders']);
        // The pending order still counts as an order, just not as revenue.
        $this->assertSame(2, $stats['total_orders']);
    }

    public function test_revenue_ignores_orders_that_were_paid_then_cancelled(): void
    {
        $this->paidOrder();
        $this->paidOrder(['status' => OrderStatus::Cancelled, 'total' => 50000]);

        $this->assertEquals(10000.0, $this->stats()['total_revenue']);
    }

    public function test_revenue_ignores_refunded_orders(): void
    {
        $this->paidOrder();
        $this->paidOrder(['status' => OrderStatus::Refunded, 'total' => 50000]);

        $this->assertEquals(10000.0, $this->stats()['total_revenue']);
    }

    public function test_average_order_value_divides_revenue_by_paid_orders(): void
    {
        $this->paidOrder(['total' => 10000]);
        $this->paidOrder(['total' => 20000]);

        $this->assertEquals(15000.0, $this->stats()['average_order_value']);
    }

    public function test_average_order_value_is_zero_with_no_paid_orders(): void
    {
        $this->assertSame(0, $this->stats()['average_order_value']);
    }

    public function test_conversion_rate_compares_paid_orders_to_product_views(): void
    {
        Product::factory()->create(['store_id' => $this->store->id, 'view_count' => 80]);
        Product::factory()->create(['store_id' => $this->store->id, 'view_count' => 20]);
        $this->paidOrder();

        $stats = $this->stats();

        $this->assertSame(100, $stats['total_views']);
        $this->assertEquals(1.0, $stats['conversion_rate']);
    }

    public function test_conversion_rate_is_zero_when_nothing_has_been_viewed(): void
    {
        $this->assertSame(0, $this->stats()['conversion_rate']);
    }

    public function test_top_products_rank_by_revenue(): void
    {
        $cheap = Product::factory()->create(['store_id' => $this->store->id]);
        $rich  = Product::factory()->create(['store_id' => $this->store->id]);

        $order = $this->paidOrder();
        $order->items()->create([
            'product_id' => $cheap->id, 'product_name' => $cheap->getTranslations('name'),
            'quantity' => 10, 'unit_price' => 100, 'total_price' => 1000,
        ]);
        $order->items()->create([
            'product_id' => $rich->id, 'product_name' => $rich->getTranslations('name'),
            'quantity' => 1, 'unit_price' => 9000, 'total_price' => 9000,
        ]);

        $top = $this->actingAs($this->seller, 'sanctum')
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk()
            ->json('data.top_products');

        $this->assertCount(2, $top);
        $this->assertSame($rich->id, $top[0]['product_id']);
        $this->assertEquals(9000.0, $top[0]['revenue']);
        // Seller product routes key on uuid, so the payload must carry it.
        $this->assertSame($rich->uuid, $top[0]['uuid']);
        $this->assertSame(10, $top[1]['units']);
    }

    public function test_top_products_ignore_unpaid_orders(): void
    {
        $product = Product::factory()->create(['store_id' => $this->store->id]);

        $pending = Order::factory()->create([
            'store_id'       => $this->store->id,
            'payment_status' => PaymentStatus::Pending,
            'status'         => OrderStatus::Pending,
        ]);
        $pending->items()->create([
            'product_id' => $product->id, 'product_name' => $product->getTranslations('name'),
            'quantity' => 5, 'unit_price' => 1000, 'total_price' => 5000,
        ]);

        $top = $this->actingAs($this->seller, 'sanctum')
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk()
            ->json('data.top_products');

        $this->assertSame([], $top);
    }

    public function test_top_products_are_scoped_to_the_sellers_store(): void
    {
        $otherStore   = Store::factory()->create();
        $otherProduct = Product::factory()->create(['store_id' => $otherStore->id]);

        $otherOrder = Order::factory()->create([
            'store_id'       => $otherStore->id,
            'payment_status' => PaymentStatus::Paid,
            'status'         => OrderStatus::Processing,
        ]);
        $otherOrder->items()->create([
            'product_id' => $otherProduct->id, 'product_name' => $otherProduct->getTranslations('name'),
            'quantity' => 3, 'unit_price' => 1000, 'total_price' => 3000,
        ]);

        $top = $this->actingAs($this->seller, 'sanctum')
            ->getJson('/api/v1/seller/dashboard')
            ->assertOk()
            ->json('data.top_products');

        $this->assertSame([], $top);
    }
}
