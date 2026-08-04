<?php

namespace Tests\Feature\Seller;

use App\Models\PaymentGateway;
use App\Models\Store;
use App\Models\StorePaymentGateway;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerPaymentTest extends TestCase
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

    public function test_seller_can_list_available_gateways(): void
    {
        $active   = PaymentGateway::factory()->count(3)->create(['is_active' => true]);
        $inactive = PaymentGateway::factory()->create(['is_active' => false]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/payments/available')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'display_name', 'required_fields', 'is_configured']],
            ]);

        // Scoped to the rows this test created — data migrations seed real
        // gateway rows, so a global count here would be brittle.
        $returned = collect($response->json('data'))->pluck('id');

        foreach ($active as $gateway) {
            $this->assertContains($gateway->id, $returned);
        }

        $this->assertNotContains($inactive->id, $returned);
    }

    public function test_available_gateways_show_configured_status(): void
    {
        $gateway = PaymentGateway::factory()->create(['is_active' => true]);

        StorePaymentGateway::create([
            'store_id'           => $this->store->id,
            'payment_gateway_id' => $gateway->id,
            'is_enabled'         => true,
            'is_sandbox'         => true,
            'credentials'        => ['api_key' => 'test'],
        ]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/payments/available')
            ->assertOk();

        $found = collect($response->json('data'))->firstWhere('id', $gateway->id);
        $this->assertTrue($found['is_configured']);
        $this->assertTrue($found['is_enabled']);
    }

    public function test_seller_can_list_configured_gateways(): void
    {
        $gateway = PaymentGateway::factory()->create();

        StorePaymentGateway::create([
            'store_id'           => $this->store->id,
            'payment_gateway_id' => $gateway->id,
            'is_enabled'         => true,
            'is_sandbox'         => false,
            'credentials'        => ['api_key' => 'key123'],
        ]);

        $this->actingAsSeller()
            ->getJson('/api/v1/seller/payments/configured')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'is_enabled', 'is_sandbox', 'gateway']],
            ]);
    }

    public function test_seller_can_configure_payment_gateway(): void
    {
        $gateway = PaymentGateway::factory()->create([
            'required_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'type' => 'text'],
            ],
        ]);

        $this->actingAsSeller()
            ->postJson('/api/v1/seller/payments/configure', [
                'payment_gateway_id' => $gateway->id,
                'is_enabled'         => true,
                'is_sandbox'         => true,
                'credentials'        => ['api_key' => 'my-api-key'],
            ])
            ->assertOk()
            ->assertJsonPath('data.is_enabled', true);

        $this->assertDatabaseHas('store_payment_gateways', [
            'store_id'           => $this->store->id,
            'payment_gateway_id' => $gateway->id,
            'is_enabled'         => true,
        ]);
    }

    public function test_configure_gateway_validates_required_credentials(): void
    {
        $gateway = PaymentGateway::factory()->create([
            'required_fields' => [
                ['key' => 'edp_id', 'label' => 'EDP ID', 'type' => 'text'],
                ['key' => 'secret_key', 'label' => 'Secret Key', 'type' => 'password'],
            ],
        ]);

        $this->actingAsSeller()
            ->postJson('/api/v1/seller/payments/configure', [
                'payment_gateway_id' => $gateway->id,
                'is_enabled'         => true,
                'is_sandbox'         => false,
                'credentials'        => ['edp_id' => '12345'],
            ])
            ->assertStatus(422);
    }

    public function test_configure_gateway_upserts_existing_config(): void
    {
        $gateway = PaymentGateway::factory()->create([
            'required_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'type' => 'text'],
            ],
        ]);

        StorePaymentGateway::create([
            'store_id'           => $this->store->id,
            'payment_gateway_id' => $gateway->id,
            'is_enabled'         => false,
            'is_sandbox'         => true,
            'credentials'        => ['api_key' => 'old-key'],
        ]);

        $this->actingAsSeller()
            ->postJson('/api/v1/seller/payments/configure', [
                'payment_gateway_id' => $gateway->id,
                'is_enabled'         => true,
                'is_sandbox'         => false,
                'credentials'        => ['api_key' => 'new-key'],
            ])
            ->assertOk();

        $this->assertEquals(1, StorePaymentGateway::where('store_id', $this->store->id)->count());
        $record = StorePaymentGateway::where('store_id', $this->store->id)->first();
        $this->assertTrue($record->is_enabled);
        $this->assertFalse($record->is_sandbox);
    }

    public function test_seller_can_toggle_gateway(): void
    {
        $gateway = PaymentGateway::factory()->create();

        $pg = StorePaymentGateway::create([
            'store_id'           => $this->store->id,
            'payment_gateway_id' => $gateway->id,
            'is_enabled'         => true,
            'is_sandbox'         => true,
            'credentials'        => ['api_key' => 'key'],
        ]);

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/payments/{$gateway->id}/toggle")
            ->assertOk()
            ->assertJsonPath('data.is_enabled', false);

        $this->assertDatabaseHas('store_payment_gateways', [
            'id'         => $pg->id,
            'is_enabled' => false,
        ]);
    }

    public function test_toggle_fails_for_unconfigured_gateway(): void
    {
        $gateway = PaymentGateway::factory()->create();

        $this->actingAsSeller()
            ->patchJson("/api/v1/seller/payments/{$gateway->id}/toggle")
            ->assertStatus(404);
    }

    public function test_unauthenticated_cannot_access_payments(): void
    {
        $this->getJson('/api/v1/seller/payments/available')->assertStatus(401);
    }

    /**
     * Idram fixes SUCCESS_URL / FAIL_URL / RESULT_URL against the merchant
     * account, so the seller has to hand them to Idram themselves — the config
     * screen is where they read them off.
     */
    public function test_idram_exposes_the_urls_the_seller_must_register(): void
    {
        $gateway = PaymentGateway::factory()->create(['name' => 'idram', 'is_active' => true]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/payments/available')
            ->assertOk();

        $urls = collect($response->json('data'))->firstWhere('id', $gateway->id)['integration_urls'];

        $this->assertStringEndsWith(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $urls['result_url']
        );
        $this->assertStringEndsWith("/store/{$this->store->slug}/checkout/success", $urls['success_url']);
        $this->assertStringEndsWith("/store/{$this->store->slug}/checkout/failed", $urls['fail_url']);
    }

    public function test_integration_urls_follow_a_verified_custom_domain(): void
    {
        $gateway = PaymentGateway::factory()->create(['name' => 'idram', 'is_active' => true]);

        $this->store->update([
            'custom_domain'             => 'shop.example.am',
            'custom_domain_verified_at' => now(),
        ]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/payments/available')
            ->assertOk();

        $urls = collect($response->json('data'))->firstWhere('id', $gateway->id)['integration_urls'];

        $this->assertSame('https://shop.example.am/checkout/success', $urls['success_url']);
        $this->assertSame('https://shop.example.am/checkout/failed', $urls['fail_url']);
    }

    public function test_gateways_without_fixed_urls_expose_none(): void
    {
        $gateway = PaymentGateway::factory()->create(['name' => 'telcell', 'is_active' => true]);

        $response = $this->actingAsSeller()
            ->getJson('/api/v1/seller/payments/available')
            ->assertOk();

        $found = collect($response->json('data'))->firstWhere('id', $gateway->id);
        $this->assertNull($found['integration_urls']);
    }
}
