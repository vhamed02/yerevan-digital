<?php

namespace Tests\Feature\Seller;

use App\Enums\StoreStatus;
use App\Models\Store;
use App\Models\User;
use App\Services\DomainService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerDomainTest extends TestCase
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
        $this->store = Store::factory()->create([
            'user_id' => $this->seller->id,
            'status'  => StoreStatus::Active,
        ]);
    }

    private function actingAsSeller(): static
    {
        return $this->actingAs($this->seller, 'sanctum');
    }

    public function test_seller_can_claim_a_domain_and_gets_dns_instructions(): void
    {
        $response = $this->actingAsSeller()
            ->patchJson('/api/v1/seller/domain', ['custom_domain' => 'HTTPS://Shop.Example.AM/'])
            ->assertOk()
            ->assertJsonPath('data.custom_domain', 'shop.example.am')
            ->assertJsonPath('data.verified', false);

        $this->assertSame('_yerevan-verify.shop.example.am', $response->json('data.dns.txt_name'));
        $this->assertNotEmpty($response->json('data.dns.txt_value'));
        $this->assertNotEmpty($response->json('data.dns.a_record'));
    }

    public function test_claiming_a_domain_never_arrives_pre_verified(): void
    {
        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/domain', ['custom_domain' => 'shop.example.am'])
            ->assertOk();

        $this->assertNull($this->store->fresh()->custom_domain_verified_at);
    }

    public function test_reclaiming_a_domain_reissues_the_token_and_drops_verification(): void
    {
        $this->store->update([
            'custom_domain'             => 'old.example.am',
            'custom_domain_token'       => 'old-token',
            'custom_domain_verified_at' => now(),
        ]);

        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/domain', ['custom_domain' => 'new.example.am'])
            ->assertOk()
            ->assertJsonPath('data.verified', false);

        $fresh = $this->store->fresh();
        $this->assertNotSame('old-token', $fresh->custom_domain_token);
        $this->assertNull($fresh->custom_domain_verified_at);
    }

    public function test_platform_domains_cannot_be_claimed(): void
    {
        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/domain', ['custom_domain' => 'yerevan.digital'])
            ->assertStatus(422);

        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/domain', ['custom_domain' => 'api.yerevan.digital'])
            ->assertStatus(422);
    }

    public function test_a_domain_already_used_by_another_store_is_rejected(): void
    {
        Store::factory()->create(['custom_domain' => 'taken.example.am']);

        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/domain', ['custom_domain' => 'taken.example.am'])
            ->assertStatus(422);
    }

    public function test_a_malformed_domain_is_rejected(): void
    {
        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/domain', ['custom_domain' => 'not a domain'])
            ->assertStatus(422);
    }

    public function test_verify_fails_when_the_txt_record_is_missing(): void
    {
        $this->store->update([
            'custom_domain'       => 'shop.example.am',
            'custom_domain_token' => 'the-token',
        ]);

        $this->mock(DomainService::class, function ($mock) {
            $mock->shouldReceive('verifyOwnership')->andReturn(false);
            $mock->shouldReceive('normalise')->andReturnUsing(fn ($h) => $h);
            $mock->shouldReceive('forget')->andReturnNull();
            $mock->shouldReceive('verificationRecordName')->andReturn('_yerevan-verify.shop.example.am');
        });

        $this->actingAsSeller()
            ->postJson('/api/v1/seller/domain/verify')
            ->assertStatus(422);

        $this->assertNull($this->store->fresh()->custom_domain_verified_at);
    }

    public function test_verify_marks_the_domain_live_when_the_record_matches(): void
    {
        $this->store->update([
            'custom_domain'       => 'shop.example.am',
            'custom_domain_token' => 'the-token',
        ]);

        $this->mock(DomainService::class, function ($mock) {
            $mock->shouldReceive('verifyOwnership')->andReturn(true);
            $mock->shouldReceive('normalise')->andReturnUsing(fn ($h) => $h);
            $mock->shouldReceive('forget')->andReturnNull();
            $mock->shouldReceive('verificationRecordName')->andReturn('_yerevan-verify.shop.example.am');
        });

        $this->actingAsSeller()
            ->postJson('/api/v1/seller/domain/verify')
            ->assertOk()
            ->assertJsonPath('data.verified', true);

        $this->assertNotNull($this->store->fresh()->custom_domain_verified_at);
    }

    public function test_verify_without_a_domain_is_rejected(): void
    {
        $this->actingAsSeller()
            ->postJson('/api/v1/seller/domain/verify')
            ->assertStatus(422);
    }

    public function test_seller_can_remove_their_domain(): void
    {
        $this->store->update([
            'custom_domain'             => 'shop.example.am',
            'custom_domain_token'       => 'tok',
            'custom_domain_verified_at' => now(),
        ]);

        $this->actingAsSeller()
            ->deleteJson('/api/v1/seller/domain')
            ->assertOk()
            ->assertJsonPath('data.custom_domain', null);

        $fresh = $this->store->fresh();
        $this->assertNull($fresh->custom_domain);
        $this->assertNull($fresh->custom_domain_verified_at);
    }

    public function test_public_resolve_returns_the_slug_for_a_live_domain(): void
    {
        $this->store->update([
            'custom_domain'             => 'shop.example.am',
            'custom_domain_verified_at' => now(),
        ]);

        $this->getJson('/api/v1/domains/resolve?host=shop.example.am')
            ->assertOk()
            ->assertJsonPath('data.slug', $this->store->slug);
    }

    public function test_public_resolve_404s_for_an_unverified_domain(): void
    {
        $this->store->update(['custom_domain' => 'shop.example.am']);

        $this->getJson('/api/v1/domains/resolve?host=shop.example.am')
            ->assertNotFound();
    }

    public function test_a_customer_cannot_manage_seller_domains(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/seller/domain')
            ->assertForbidden();
    }
}
