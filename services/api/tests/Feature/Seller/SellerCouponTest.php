<?php

namespace Tests\Feature\Seller;

use App\Models\Coupon;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerCouponTest extends TestCase
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

    public function test_seller_can_create_a_coupon(): void
    {
        $this->actingAsSeller()
            ->postJson('/api/v1/seller/coupons', [
                'code'  => 'summer25',
                'type'  => 'percent',
                'value' => 25,
            ])
            ->assertCreated()
            ->assertJsonPath('data.code', 'SUMMER25')
            ->assertJsonPath('data.type', 'percent');

        $this->assertDatabaseHas('coupons', ['store_id' => $this->store->id, 'code' => 'SUMMER25']);
    }

    public function test_seller_only_sees_their_own_coupons(): void
    {
        Coupon::factory()->create(['store_id' => $this->store->id]);
        Coupon::factory()->create();

        $response = $this->actingAsSeller()->getJson('/api/v1/seller/coupons')->assertOk();

        $this->assertCount(1, $response->json('data.data'));
    }

    public function test_seller_cannot_touch_another_stores_coupon(): void
    {
        $foreign = Coupon::factory()->create();

        $this->actingAsSeller()->getJson("/api/v1/seller/coupons/{$foreign->uuid}")->assertNotFound();
        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/coupons/{$foreign->uuid}", ['value' => 1])
            ->assertNotFound();
        $this->actingAsSeller()->deleteJson("/api/v1/seller/coupons/{$foreign->uuid}")->assertNotFound();
    }

    public function test_duplicate_code_in_the_same_store_is_rejected_regardless_of_case(): void
    {
        Coupon::factory()->create(['store_id' => $this->store->id, 'code' => 'SUMMER25']);

        // Codes are upper-cased on save, so "summer25" would collide.
        $this->actingAsSeller()
            ->postJson('/api/v1/seller/coupons', ['code' => 'summer25', 'type' => 'fixed', 'value' => 100])
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');
    }

    public function test_two_stores_may_use_the_same_code(): void
    {
        Coupon::factory()->create(['code' => 'SHARED']);

        $this->actingAsSeller()
            ->postJson('/api/v1/seller/coupons', ['code' => 'SHARED', 'type' => 'fixed', 'value' => 100])
            ->assertCreated();
    }

    public function test_a_percentage_over_one_hundred_is_rejected(): void
    {
        $this->actingAsSeller()
            ->postJson('/api/v1/seller/coupons', ['code' => 'TOOMUCH', 'type' => 'percent', 'value' => 150])
            ->assertStatus(422)
            ->assertJsonValidationErrors('value');
    }

    public function test_an_end_date_before_the_start_date_is_rejected(): void
    {
        $this->actingAsSeller()
            ->postJson('/api/v1/seller/coupons', [
                'code'      => 'BACKWARDS',
                'type'      => 'fixed',
                'value'     => 100,
                'starts_at' => now()->addDays(5)->toDateString(),
                'ends_at'   => now()->addDay()->toDateString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('ends_at');
    }

    public function test_a_code_with_spaces_is_rejected(): void
    {
        $this->actingAsSeller()
            ->postJson('/api/v1/seller/coupons', ['code' => 'NOT VALID', 'type' => 'fixed', 'value' => 100])
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');
    }

    public function test_seller_can_update_and_delete_their_coupon(): void
    {
        $coupon = Coupon::factory()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/coupons/{$coupon->uuid}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->actingAsSeller()
            ->deleteJson("/api/v1/seller/coupons/{$coupon->uuid}")
            ->assertOk();

        $this->assertSoftDeleted('coupons', ['id' => $coupon->id]);
    }

    public function test_updating_a_coupon_keeps_its_own_code_valid(): void
    {
        $coupon = Coupon::factory()->create(['store_id' => $this->store->id, 'code' => 'KEEPME']);

        // The unique rule must ignore the row being edited.
        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/coupons/{$coupon->uuid}", ['code' => 'KEEPME', 'value' => 250])
            ->assertOk();
    }

    public function test_a_customer_cannot_reach_seller_coupons(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/seller/coupons')
            ->assertForbidden();
    }
}
