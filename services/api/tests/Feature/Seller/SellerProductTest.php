<?php

namespace Tests\Feature\Seller;

use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerProductTest extends TestCase
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

    public function test_seller_can_list_own_products(): void
    {
        Product::factory()->count(3)->create(['store_id' => $this->store->id]);

        $other = Store::factory()->create();
        Product::factory()->count(2)->create(['store_id' => $other->id]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/products')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => ['data' => [['id', 'uuid', 'name', 'status']], 'meta' => ['total']],
            ]);

        $this->assertEquals(3, $response->json('data.meta.total'));
    }

    public function test_seller_can_filter_products_by_status(): void
    {
        Product::factory()->count(2)->create(['store_id' => $this->store->id, 'status' => ProductStatus::Active]);
        Product::factory()->draft()->create(['store_id' => $this->store->id]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/products?status=draft')
            ->assertOk();

        $this->assertEquals(1, $response->json('data.meta.total'));
    }

    public function test_seller_can_view_own_product(): void
    {
        $product = Product::factory()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->getJson("/api/v1/seller/products/{$product->uuid}")
            ->assertOk()
            ->assertJsonPath('data.uuid', $product->uuid);
    }

    public function test_seller_cannot_view_another_stores_product(): void
    {
        $other = Store::factory()->create();
        $product = Product::factory()->create(['store_id' => $other->id]);

        $this->actingAsSeller()
            ->getJson("/api/v1/seller/products/{$product->uuid}")
            ->assertStatus(404);
    }

    public function test_seller_can_create_product(): void
    {
        $response = $this->actingAsSeller()
            ->postJson('/api/v1/seller/products', [
                'name'  => ['hy' => 'Կարմիր Վարդ', 'en' => 'Red Rose'],
                'price' => 15000,
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.name.en', 'Red Rose');

        $this->assertDatabaseHas('products', [
            'store_id' => $this->store->id,
            'slug'     => 'red-rose',
        ]);
    }

    public function test_product_slug_auto_generated_from_english_name(): void
    {
        $this->actingAsSeller()
            ->postJson('/api/v1/seller/products', [
                'name'  => ['hy' => 'Կապույտ Ծաղիկ', 'en' => 'Blue Flower'],
                'price' => 5000,
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('products', ['slug' => 'blue-flower']);
    }

    public function test_slug_is_unique_per_store(): void
    {
        Product::factory()->create(['store_id' => $this->store->id, 'slug' => 'blue-flower']);

        $this->actingAsSeller()
            ->postJson('/api/v1/seller/products', [
                'name'  => ['hy' => 'Կապույտ', 'en' => 'Blue Flower'],
                'price' => 5000,
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('products', ['store_id' => $this->store->id, 'slug' => 'blue-flower-2']);
    }

    public function test_create_product_requires_name_and_price(): void
    {
        $this->actingAsSeller()
            ->postJson('/api/v1/seller/products', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'price']);
    }

    public function test_seller_can_update_product(): void
    {
        $product = Product::factory()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/products/{$product->uuid}", [
                'price' => 99999,
            ])
            ->assertOk()
            ->assertJsonPath('data.price', '99999.00');
    }

    public function test_seller_can_quick_update_product_status(): void
    {
        $product = Product::factory()->draft()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/products/{$product->uuid}/status", ['status' => 'active'])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'status' => 'active']);
    }

    public function test_status_update_rejects_invalid_status(): void
    {
        $product = Product::factory()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/products/{$product->uuid}/status", ['status' => 'published'])
            ->assertStatus(422);
    }

    public function test_seller_can_soft_delete_product(): void
    {
        $product = Product::factory()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->deleteJson("/api/v1/seller/products/{$product->uuid}")
            ->assertOk();

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_unauthenticated_cannot_access_seller_products(): void
    {
        $this->getJson('/api/v1/seller/products')->assertStatus(401);
    }
}
