<?php

namespace Tests\Feature\Seller;

use App\Models\ShippingZone;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerShippingZoneTest extends TestCase
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

    public function test_seller_can_create_a_zone(): void
    {
        $this->actingAsSeller()
            ->postJson('/api/v1/seller/shipping-zones', [
                'name'   => ['hy' => 'Երևան', 'en' => 'Yerevan'],
                'cities' => ['Yerevan', 'Abovyan'],
                'rate'   => 1000,
            ])
            ->assertCreated()
            ->assertJsonPath('data.rate', '1000.00')
            ->assertJsonPath('data.cities', ['Yerevan', 'Abovyan']);
    }

    public function test_seller_only_sees_their_own_zones(): void
    {
        ShippingZone::factory()->create(['store_id' => $this->store->id]);
        ShippingZone::factory()->create();

        $response = $this->actingAsSeller()->getJson('/api/v1/seller/shipping-zones')->assertOk();

        $this->assertCount(1, $response->json('data'));
    }

    public function test_seller_cannot_touch_another_stores_zone(): void
    {
        $foreign = ShippingZone::factory()->create();

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/shipping-zones/{$foreign->uuid}", ['rate' => 1])
            ->assertNotFound();
        $this->actingAsSeller()
            ->deleteJson("/api/v1/seller/shipping-zones/{$foreign->uuid}")
            ->assertNotFound();
    }

    public function test_promoting_a_zone_to_fallback_demotes_the_previous_one(): void
    {
        $first = ShippingZone::factory()->fallback()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->postJson('/api/v1/seller/shipping-zones', [
                'name'       => ['hy' => 'Մարզեր', 'en' => 'Regions'],
                'cities'     => [],
                'rate'       => 2500,
                'is_default' => true,
            ])
            ->assertCreated();

        // Two fallbacks would make zone resolution arbitrary.
        $this->assertFalse($first->fresh()->is_default);
        $this->assertSame(1, ShippingZone::byStore($this->store->id)->where('is_default', true)->count());
    }

    public function test_promoting_via_update_also_demotes_the_previous_fallback(): void
    {
        $first  = ShippingZone::factory()->fallback()->create(['store_id' => $this->store->id]);
        $second = ShippingZone::factory()->create(['store_id' => $this->store->id]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/shipping-zones/{$second->uuid}", ['is_default' => true])
            ->assertOk();

        $this->assertFalse($first->fresh()->is_default);
        $this->assertTrue($second->fresh()->is_default);
    }

    public function test_a_negative_rate_is_rejected(): void
    {
        $this->actingAsSeller()
            ->postJson('/api/v1/seller/shipping-zones', [
                'name' => ['hy' => 'Ա', 'en' => 'A'],
                'rate' => -5,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('rate');
    }

    public function test_public_quote_endpoint_prices_by_city(): void
    {
        ShippingZone::factory()->create(['store_id' => $this->store->id, 'rate' => 1000]);

        $this->postJson("/api/v1/store/{$this->store->slug}/shipping/quote", [
            'city'     => 'Yerevan',
            'subtotal' => 20000,
        ])
            ->assertOk()
            ->assertJsonPath('data.cost', '1000.00');
    }

    public function test_public_zones_endpoint_hides_inactive_zones(): void
    {
        ShippingZone::factory()->create(['store_id' => $this->store->id]);
        ShippingZone::factory()->create(['store_id' => $this->store->id, 'is_active' => false]);

        $response = $this->getJson("/api/v1/store/{$this->store->slug}/shipping/zones")->assertOk();

        $this->assertCount(1, $response->json('data'));
    }
}
