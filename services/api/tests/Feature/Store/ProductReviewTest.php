<?php

namespace Tests\Feature\Store;

use App\Enums\ProductStatus;
use App\Enums\StoreStatus;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\Store;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductReviewTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->store = Store::factory()->create(['status' => StoreStatus::Active]);
        $this->product = Product::factory()->create([
            'store_id' => $this->store->id,
            'status'   => ProductStatus::Active,
        ]);
    }

    private function validCaptcha(): array
    {
        $answer  = 7;
        $payload = base64_encode(json_encode(['a' => $answer, 'e' => time() + 600]));
        $sig     = substr(hash_hmac('sha256', $payload, config('app.key')), 0, 40);

        return [
            'captcha_token'  => $payload . '.' . $sig,
            'captcha_answer' => (string) $answer,
        ];
    }

    public function test_review_can_be_submitted_with_valid_captcha(): void
    {
        $payload = array_merge([
            'reviewer_name' => 'Hayk Petrosyan',
            'rating'        => 5,
            'body'          => 'Great product!',
        ], $this->validCaptcha());

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/products/{$this->product->slug}/reviews",
            $payload
        )->assertOk();

        $this->assertDatabaseHas('product_reviews', [
            'product_id'    => $this->product->id,
            'reviewer_name' => 'Hayk Petrosyan',
            'rating'        => 5,
            'is_approved'   => false,
        ]);
    }

    public function test_review_requires_reviewer_name(): void
    {
        $payload = array_merge([
            'rating' => 4,
        ], $this->validCaptcha());

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/products/{$this->product->slug}/reviews",
            $payload
        )->assertUnprocessable()
            ->assertJsonValidationErrors(['reviewer_name']);
    }

    public function test_review_requires_rating(): void
    {
        $payload = array_merge([
            'reviewer_name' => 'Nune',
        ], $this->validCaptcha());

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/products/{$this->product->slug}/reviews",
            $payload
        )->assertUnprocessable()
            ->assertJsonValidationErrors(['rating']);
    }

    public function test_rating_must_be_between_one_and_five(): void
    {
        $payload = array_merge([
            'reviewer_name' => 'Nune',
            'rating'        => 6,
        ], $this->validCaptcha());

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/products/{$this->product->slug}/reviews",
            $payload
        )->assertUnprocessable()
            ->assertJsonValidationErrors(['rating']);
    }

    public function test_review_rejects_duplicate_email_for_same_product(): void
    {
        ProductReview::factory()->create([
            'store_id'       => $this->store->id,
            'product_id'     => $this->product->id,
            'reviewer_email' => 'test@example.com',
        ]);

        $payload = array_merge([
            'reviewer_name'  => 'Another Person',
            'reviewer_email' => 'test@example.com',
            'rating'         => 3,
        ], $this->validCaptcha());

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/products/{$this->product->slug}/reviews",
            $payload
        )->assertUnprocessable()
            ->assertJsonValidationErrors(['reviewer_email']);
    }

    public function test_review_allows_multiple_anonymous_submissions(): void
    {
        ProductReview::factory()->create([
            'store_id'       => $this->store->id,
            'product_id'     => $this->product->id,
            'reviewer_email' => null,
        ]);

        $payload = array_merge([
            'reviewer_name' => 'Someone Else',
            'rating'        => 4,
        ], $this->validCaptcha());

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/products/{$this->product->slug}/reviews",
            $payload
        )->assertOk();
    }

    public function test_review_fails_with_invalid_captcha(): void
    {
        $this->postJson(
            "/api/v1/store/{$this->store->slug}/products/{$this->product->slug}/reviews",
            [
                'reviewer_name'  => 'Gor',
                'rating'         => 4,
                'captcha_token'  => 'invalid.token',
                'captcha_answer' => '5',
            ]
        )->assertUnprocessable()
            ->assertJsonValidationErrors(['captcha']);
    }

    public function test_review_returns_404_for_draft_product(): void
    {
        $draft = Product::factory()->draft()->create(['store_id' => $this->store->id]);

        $payload = array_merge([
            'reviewer_name' => 'Armen',
            'rating'        => 3,
        ], $this->validCaptcha());

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/products/{$draft->slug}/reviews",
            $payload
        )->assertNotFound();
    }

    public function test_review_returns_404_for_product_from_another_store(): void
    {
        $other   = Store::factory()->create(['status' => StoreStatus::Active]);
        $product = Product::factory()->create(['store_id' => $other->id, 'status' => ProductStatus::Active]);

        $payload = array_merge([
            'reviewer_name' => 'Mariam',
            'rating'        => 5,
        ], $this->validCaptcha());

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/products/{$product->slug}/reviews",
            $payload
        )->assertNotFound();
    }

    public function test_product_detail_includes_only_approved_reviews(): void
    {
        ProductReview::factory()->approved()->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
        ]);
        ProductReview::factory()->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
            'is_approved' => false,
        ]);

        $response = $this->getJson(
            "/api/v1/store/{$this->store->slug}/products/{$this->product->slug}"
        )->assertOk();

        $this->assertCount(1, $response->json('data.reviews'));
        $this->assertEquals(1, $response->json('data.rating_count'));
    }

    public function test_rating_aggregate_counts_all_approved_reviews_beyond_display_cap(): void
    {
        // 60 approved reviews — more than the 50-row display cap.
        ProductReview::factory()->approved()->count(55)->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
            'rating'     => 4,
        ]);
        ProductReview::factory()->approved()->count(5)->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
            'rating'     => 5,
        ]);
        // Unapproved reviews must not affect the aggregate.
        ProductReview::factory()->count(3)->create([
            'store_id'   => $this->store->id,
            'product_id' => $this->product->id,
            'rating'     => 1,
        ]);

        $response = $this->getJson(
            "/api/v1/store/{$this->store->slug}/products/{$this->product->slug}"
        )->assertOk();

        // Display list is capped at 50, but the aggregate spans all 60 approved.
        $this->assertCount(50, $response->json('data.reviews'));
        $this->assertEquals(60, $response->json('data.rating_count'));
        // (55*4 + 5*5) / 60 = 4.08 -> rounded to 4.1
        $this->assertEquals(4.1, $response->json('data.rating_avg'));
    }
}
