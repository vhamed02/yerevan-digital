<?php

namespace Tests\Feature\Store;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Enums\StoreStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private Store   $store;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->store = Store::factory()->create(['status' => StoreStatus::Active]);

        $this->product = Product::factory()->create([
            'store_id'     => $this->store->id,
            'status'       => ProductStatus::Active,
            'price'        => 15000,
            'stock'        => 10,
            'manage_stock' => true,
        ]);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'full_name'      => 'Anna Grigoryan',
            'email'          => 'anna@example.com',
            'phone'          => '+37491000000',
            'address'        => 'Baghramyan Ave 1',
            'city'           => 'Yerevan',
            'postal_code'    => '0001',
            'country'        => 'Armenia',
            'payment_method' => 'idram',
            'items'          => [
                [
                    'product_id' => $this->product->uuid,
                    'variant_id' => null,
                    'quantity'   => 2,
                ],
            ],
        ], $overrides);
    }

    public function test_checkout_creates_order_with_correct_total(): void
    {
        $this->postJson("/api/v1/store/{$this->store->slug}/checkout", $this->validPayload())
            ->assertCreated()
            ->assertJsonStructure([
                'data' => ['uuid', 'order_number', 'total', 'currency', 'payment_gateway'],
            ])
            ->assertJsonPath('data.total', 30000);

        $this->assertDatabaseHas('orders', [
            'store_id'       => $this->store->id,
            'customer_name'  => 'Anna Grigoryan',
            'customer_email' => 'anna@example.com',
            'status'         => OrderStatus::Pending->value,
            'payment_status' => PaymentStatus::Pending->value,
            'total'          => 30000,
        ]);
    }

    public function test_checkout_decrements_stock(): void
    {
        $this->postJson("/api/v1/store/{$this->store->slug}/checkout", $this->validPayload())
            ->assertCreated();

        $this->assertEquals(8, $this->product->fresh()->stock);
    }

    public function test_checkout_creates_order_items(): void
    {
        $response = $this->postJson("/api/v1/store/{$this->store->slug}/checkout", $this->validPayload())
            ->assertCreated();

        $orderUuid = $response->json('data.uuid');
        $order     = Order::where('uuid', $orderUuid)->firstOrFail();

        $this->assertCount(1, $order->items);
        $this->assertEquals(2, $order->items->first()->quantity);
        $this->assertEquals(15000, $order->items->first()->unit_price);
    }

    public function test_checkout_fails_with_insufficient_stock(): void
    {
        $this->postJson("/api/v1/store/{$this->store->slug}/checkout", $this->validPayload([
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'variant_id' => null,
                    'quantity'   => 99,
                ],
            ],
        ]))->assertStatus(422);

        $this->assertEquals(10, $this->product->fresh()->stock);
    }

    public function test_checkout_fails_for_draft_product(): void
    {
        $draft = Product::factory()->draft()->create(['store_id' => $this->store->id]);

        $this->postJson("/api/v1/store/{$this->store->slug}/checkout", $this->validPayload([
            'items' => [['product_id' => $draft->uuid, 'variant_id' => null, 'quantity' => 1]],
        ]))->assertStatus(404);
    }

    public function test_checkout_fails_for_product_from_another_store(): void
    {
        $other = Product::factory()->create();

        $this->postJson("/api/v1/store/{$this->store->slug}/checkout", $this->validPayload([
            'items' => [['product_id' => $other->uuid, 'variant_id' => null, 'quantity' => 1]],
        ]))->assertStatus(404);
    }

    public function test_checkout_with_variant_uses_variant_price(): void
    {
        $variant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'price'      => 20000,
            'stock'      => 5,
            'is_active'  => true,
        ]);

        $response = $this->postJson("/api/v1/store/{$this->store->slug}/checkout", $this->validPayload([
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'variant_id' => $variant->id,
                    'quantity'   => 1,
                ],
            ],
        ]))->assertCreated();

        $this->assertEquals(20000, $response->json('data.total'));
        $this->assertEquals(4, $variant->fresh()->stock);
    }

    public function test_checkout_validates_required_fields(): void
    {
        $this->postJson("/api/v1/store/{$this->store->slug}/checkout", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['full_name', 'email', 'address', 'city', 'country', 'payment_method', 'items']);
    }

    public function test_order_is_rolled_back_when_stock_insufficient_in_multi_item_checkout(): void
    {
        $lowStock = Product::factory()->create([
            'store_id'     => $this->store->id,
            'status'       => ProductStatus::Active,
            'stock'        => 1,
            'manage_stock' => true,
        ]);

        $initialCount = Order::count();

        $this->postJson("/api/v1/store/{$this->store->slug}/checkout", $this->validPayload([
            'items' => [
                ['product_id' => $this->product->uuid, 'variant_id' => null, 'quantity' => 1],
                ['product_id' => $lowStock->uuid, 'variant_id' => null, 'quantity' => 99],
            ],
        ]))->assertStatus(422);

        $this->assertEquals($initialCount, Order::count());
        $this->assertEquals(10, $this->product->fresh()->stock);
    }

    public function test_order_show_returns_order_for_valid_store_and_uuid(): void
    {
        $response = $this->postJson("/api/v1/store/{$this->store->slug}/checkout", $this->validPayload())
            ->assertCreated();

        $uuid = $response->json('data.uuid');

        $this->getJson("/api/v1/store/{$this->store->slug}/orders/{$uuid}")
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['uuid', 'order_number', 'status', 'total', 'customer_name', 'items'],
            ])
            ->assertJsonPath('data.uuid', $uuid);
    }
}
