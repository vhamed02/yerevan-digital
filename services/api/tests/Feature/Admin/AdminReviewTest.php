<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\ProductReview;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AdminReviewTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Store $store;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->admin = User::factory()->admin()->create();
        $this->admin->assignRole('super-admin');

        $this->store   = Store::factory()->create();
        $this->product = Product::factory()->create(['store_id' => $this->store->id]);
    }

    private function actingAsAdmin(): static
    {
        return $this->actingAs($this->admin, 'sanctum');
    }

    public function test_admin_can_list_pending_reviews(): void
    {
        ProductReview::factory()->count(3)->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
            'is_approved' => false,
        ]);
        ProductReview::factory()->approved()->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/admin/reviews?status=pending')
            ->assertOk();

        $this->assertCount(3, $response->json('data.data'));
    }

    public function test_admin_can_list_approved_reviews(): void
    {
        ProductReview::factory()->approved()->count(2)->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
        ]);
        ProductReview::factory()->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/admin/reviews?status=approved')
            ->assertOk();

        $this->assertCount(2, $response->json('data.data'));
    }

    public function test_admin_can_approve_a_review(): void
    {
        $review = ProductReview::factory()->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
        ]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/reviews/{$review->id}/approve")
            ->assertOk();

        $this->assertTrue($review->fresh()->is_approved);
    }

    public function test_approving_review_clears_product_cache(): void
    {
        $review = ProductReview::factory()->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
        ]);

        $cacheKey = "store:{$this->store->slug}:product:{$this->product->slug}";
        Cache::put($cacheKey, ['cached' => 'data'], 60);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/reviews/{$review->id}/approve")
            ->assertOk();

        $this->assertFalse(Cache::has($cacheKey));
    }

    public function test_admin_can_delete_a_review(): void
    {
        $review = ProductReview::factory()->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
        ]);

        $this->actingAsAdmin()
            ->deleteJson("/api/v1/admin/reviews/{$review->id}")
            ->assertOk();

        $this->assertDatabaseMissing('product_reviews', ['id' => $review->id]);
    }

    public function test_guest_cannot_list_reviews(): void
    {
        $this->getJson('/api/v1/admin/reviews')
            ->assertUnauthorized();
    }

    public function test_guest_cannot_approve_review(): void
    {
        $review = ProductReview::factory()->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
        ]);

        $this->patchJson("/api/v1/admin/reviews/{$review->id}/approve")
            ->assertUnauthorized();
    }

    public function test_review_response_contains_product_and_store(): void
    {
        ProductReview::factory()->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/admin/reviews')
            ->assertOk();

        $review = $response->json('data.data.0');
        $this->assertArrayHasKey('product', $review);
        $this->assertArrayHasKey('store', $review);
        $this->assertArrayHasKey('name', $review['product']);
        $this->assertArrayHasKey('slug', $review['store']);
    }
}
