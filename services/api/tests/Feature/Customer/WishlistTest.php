<?php

namespace Tests\Feature\Customer;

use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\User;
use App\Models\WishlistItem;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WishlistTest extends TestCase
{
    use RefreshDatabase;

    private User    $customer;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->customer = User::factory()->create();
        $this->product  = Product::factory()->create(['status' => ProductStatus::Active]);
    }

    private function actingAsCustomer(): static
    {
        return $this->actingAs($this->customer, 'sanctum');
    }

    public function test_customer_can_save_a_product(): void
    {
        $this->actingAsCustomer()
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid])
            ->assertCreated();

        $this->assertDatabaseHas('wishlist_items', [
            'user_id'    => $this->customer->id,
            'product_id' => $this->product->id,
        ]);
    }

    public function test_saving_twice_is_idempotent(): void
    {
        $this->actingAsCustomer()
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid])
            ->assertCreated();
        $this->actingAsCustomer()
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid])
            ->assertCreated();

        $this->assertSame(1, WishlistItem::forUser($this->customer->id)->count());
    }

    public function test_customer_can_list_their_saved_products(): void
    {
        $this->actingAsCustomer()
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid]);

        $response = $this->actingAsCustomer()
            ->getJson('/api/v1/customer/wishlist')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame($this->product->uuid, $response->json('data.0.product.uuid'));
        $this->assertNotNull($response->json('data.0.store_slug'));
    }

    public function test_ids_endpoint_returns_saved_product_uuids(): void
    {
        $this->actingAsCustomer()
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid]);

        $this->actingAsCustomer()
            ->getJson('/api/v1/customer/wishlist/ids')
            ->assertOk()
            ->assertJsonPath('data.product_uuids', [$this->product->uuid]);
    }

    public function test_customer_can_remove_a_saved_product(): void
    {
        $this->actingAsCustomer()
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid]);

        $this->actingAsCustomer()
            ->deleteJson("/api/v1/customer/wishlist/{$this->product->uuid}")
            ->assertOk();

        $this->assertSame(0, WishlistItem::forUser($this->customer->id)->count());
    }

    public function test_a_draft_product_cannot_be_saved(): void
    {
        $draft = Product::factory()->create(['status' => ProductStatus::Draft]);

        $this->actingAsCustomer()
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $draft->uuid])
            ->assertNotFound();
    }

    public function test_an_unknown_product_is_rejected(): void
    {
        $this->actingAsCustomer()
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => 'not-a-real-uuid'])
            ->assertNotFound();
    }

    public function test_wishlists_are_private_to_their_owner(): void
    {
        $other = User::factory()->create();

        $this->actingAs($other, 'sanctum')
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid])
            ->assertCreated();

        // The other customer's save must not appear in this customer's list.
        $this->actingAsCustomer()
            ->getJson('/api/v1/customer/wishlist')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_removing_only_affects_your_own_wishlist(): void
    {
        $other = User::factory()->create();

        $this->actingAs($other, 'sanctum')
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid]);
        $this->actingAsCustomer()
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid]);

        $this->actingAsCustomer()
            ->deleteJson("/api/v1/customer/wishlist/{$this->product->uuid}")
            ->assertOk();

        $this->assertSame(1, WishlistItem::forUser($other->id)->count());
    }

    public function test_a_guest_cannot_use_the_wishlist(): void
    {
        $this->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid])
            ->assertUnauthorized();

        $this->getJson('/api/v1/customer/wishlist')->assertUnauthorized();
    }

    public function test_deleting_a_product_removes_it_from_wishlists(): void
    {
        $this->actingAsCustomer()
            ->postJson('/api/v1/customer/wishlist', ['product_uuid' => $this->product->uuid]);

        $this->product->forceDelete();

        $this->assertSame(0, WishlistItem::forUser($this->customer->id)->count());
    }
}
