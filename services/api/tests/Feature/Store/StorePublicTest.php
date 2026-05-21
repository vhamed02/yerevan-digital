<?php

namespace Tests\Feature\Store;

use App\Enums\ProductStatus;
use App\Enums\StoreStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Store;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class StorePublicTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->store = Store::factory()->create([
            'status'              => StoreStatus::Active,
            'active_template_key' => 'minimal',
            'primary_color'       => '#6366f1',
        ]);
    }

    public function test_store_info_returns_public_store_data(): void
    {
        $this->getJson("/api/v1/store/{$this->store->slug}/info")
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'slug', 'name', 'active_template_key', 'template_config'],
            ])
            ->assertJsonPath('data.slug', $this->store->slug)
            ->assertJsonPath('data.active_template_key', 'minimal');
    }

    public function test_store_info_returns_404_for_unknown_slug(): void
    {
        $this->getJson('/api/v1/store/does-not-exist/info')
            ->assertNotFound();
    }

    public function test_suspended_store_returns_503(): void
    {
        $this->store->update(['status' => StoreStatus::Suspended]);

        $this->getJson("/api/v1/store/{$this->store->slug}/info")
            ->assertStatus(503);
    }

    public function test_store_info_is_cached(): void
    {
        Cache::flush();

        $this->getJson("/api/v1/store/{$this->store->slug}/info")->assertOk();

        $this->assertTrue(Cache::has("store:public:{$this->store->slug}"));
    }

    public function test_products_list_returns_active_products_only(): void
    {
        Product::factory()->count(3)->create([
            'store_id' => $this->store->id,
            'status'   => ProductStatus::Active,
        ]);
        Product::factory()->draft()->create(['store_id' => $this->store->id]);

        $response = $this->getJson("/api/v1/store/{$this->store->slug}/products")
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'data' => [['uuid', 'name', 'slug', 'price']],
                    'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                ],
            ]);

        $this->assertEquals(3, $response->json('data.meta.total'));
    }

    public function test_products_list_does_not_include_other_store_products(): void
    {
        Product::factory()->count(2)->create(['store_id' => $this->store->id]);
        Product::factory()->count(3)->create();

        $response = $this->getJson("/api/v1/store/{$this->store->slug}/products")->assertOk();

        $this->assertEquals(2, $response->json('data.meta.total'));
    }

    public function test_products_list_respects_per_page_maximum(): void
    {
        Product::factory()->count(5)->create(['store_id' => $this->store->id]);

        $response = $this->getJson("/api/v1/store/{$this->store->slug}/products?per_page=200")
            ->assertOk();

        $this->assertLessThanOrEqual(50, $response->json('data.meta.per_page'));
    }

    public function test_products_list_filters_by_featured(): void
    {
        Product::factory()->count(2)->create(['store_id' => $this->store->id, 'is_featured' => true]);
        Product::factory()->count(3)->create(['store_id' => $this->store->id, 'is_featured' => false]);

        $response = $this->getJson("/api/v1/store/{$this->store->slug}/products?featured=1")
            ->assertOk();

        $this->assertEquals(2, $response->json('data.meta.total'));
    }

    public function test_products_list_filters_by_in_stock(): void
    {
        Product::factory()->count(2)->create([
            'store_id'     => $this->store->id,
            'manage_stock' => true,
            'stock'        => 5,
        ]);
        Product::factory()->count(3)->create([
            'store_id'     => $this->store->id,
            'manage_stock' => true,
            'stock'        => 0,
        ]);

        $response = $this->getJson("/api/v1/store/{$this->store->slug}/products?in_stock=1")
            ->assertOk();

        $this->assertEquals(2, $response->json('data.meta.total'));
    }

    public function test_products_list_filters_by_on_sale(): void
    {
        Product::factory()->count(2)->create([
            'store_id'      => $this->store->id,
            'price'         => 5000,
            'compare_price' => 8000,
        ]);
        Product::factory()->count(3)->create([
            'store_id'      => $this->store->id,
            'price'         => 5000,
            'compare_price' => null,
        ]);

        $response = $this->getJson("/api/v1/store/{$this->store->slug}/products?on_sale=1")
            ->assertOk();

        $this->assertEquals(2, $response->json('data.meta.total'));
    }

    public function test_product_detail_returns_active_product(): void
    {
        $product = Product::factory()->create([
            'store_id' => $this->store->id,
            'status'   => ProductStatus::Active,
        ]);

        $this->getJson("/api/v1/store/{$this->store->slug}/products/{$product->slug}")
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['uuid', 'slug', 'name', 'price', 'images', 'variants'],
            ])
            ->assertJsonPath('data.uuid', $product->uuid);
    }

    public function test_product_view_increments_on_first_visit(): void
    {
        $product = Product::factory()->create([
            'store_id'    => $this->store->id,
            'status'      => ProductStatus::Active,
            'view_count'  => 0,
        ]);

        $this->getJson("/api/v1/store/{$this->store->slug}/products/{$product->slug}");

        $this->assertEquals(1, $product->fresh()->view_count);
    }

    public function test_product_view_deduplicates_same_ip_within_12_hours(): void
    {
        $product = Product::factory()->create([
            'store_id'   => $this->store->id,
            'status'     => ProductStatus::Active,
            'view_count' => 0,
        ]);

        $url = "/api/v1/store/{$this->store->slug}/products/{$product->slug}";

        $this->getJson($url);
        $this->getJson($url);
        $this->getJson($url);

        $this->assertEquals(1, $product->fresh()->view_count);
    }

    public function test_product_view_not_counted_in_preview_mode(): void
    {
        $product = Product::factory()->create([
            'store_id'   => $this->store->id,
            'status'     => ProductStatus::Active,
            'view_count' => 0,
        ]);

        $this->getJson("/api/v1/store/{$this->store->slug}/products/{$product->slug}?preview=true");

        $this->assertEquals(0, $product->fresh()->view_count);
    }

    public function test_product_detail_includes_view_count(): void
    {
        $product = Product::factory()->create([
            'store_id'   => $this->store->id,
            'status'     => ProductStatus::Active,
            'view_count' => 42,
        ]);

        $this->getJson("/api/v1/store/{$this->store->slug}/products/{$product->slug}?preview=true")
            ->assertOk()
            ->assertJsonPath('data.view_count', 42);
    }

    public function test_product_detail_returns_404_for_draft(): void
    {
        $product = Product::factory()->draft()->create(['store_id' => $this->store->id]);

        $this->getJson("/api/v1/store/{$this->store->slug}/products/{$product->slug}")
            ->assertNotFound();
    }

    public function test_product_detail_returns_404_for_other_store(): void
    {
        $otherStore = Store::factory()->create();
        $product    = Product::factory()->create(['store_id' => $otherStore->id]);

        $this->getJson("/api/v1/store/{$this->store->slug}/products/{$product->slug}")
            ->assertNotFound();
    }

    public function test_categories_returns_only_categories_with_active_products(): void
    {
        $catWithProducts = Category::factory()->create(['is_active' => true]);
        $catEmpty        = Category::factory()->create(['is_active' => true]);

        Product::factory()->create([
            'store_id'    => $this->store->id,
            'category_id' => $catWithProducts->id,
            'status'      => ProductStatus::Active,
        ]);

        $response = $this->getJson("/api/v1/store/{$this->store->slug}/categories")
            ->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertContains($catWithProducts->id, $ids->toArray());
        $this->assertNotContains($catEmpty->id, $ids->toArray());
    }

    public function test_check_slug_returns_available_for_unused_slug(): void
    {
        $this->getJson('/api/v1/stores/check-slug?slug=brand-new-store')
            ->assertOk()
            ->assertJsonPath('data.available', true);
    }

    public function test_check_slug_returns_unavailable_for_existing_slug(): void
    {
        $this->getJson("/api/v1/stores/check-slug?slug={$this->store->slug}")
            ->assertOk()
            ->assertJsonPath('data.available', false);
    }

    public function test_stats_returns_platform_counts(): void
    {
        $this->getJson('/api/v1/stats')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['total_stores', 'total_products', 'total_orders'],
            ]);
    }

    public function test_featured_stores_returns_max_six(): void
    {
        Store::factory()->count(8)->create([
            'status'      => StoreStatus::Active,
            'is_featured' => true,
        ]);

        $response = $this->getJson('/api/v1/stores/featured')->assertOk();

        $this->assertLessThanOrEqual(6, count($response->json('data')));
    }
}
