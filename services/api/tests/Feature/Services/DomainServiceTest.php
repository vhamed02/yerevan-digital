<?php

namespace Tests\Feature\Services;

use App\Enums\StoreStatus;
use App\Models\Store;
use App\Services\DomainService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DomainServiceTest extends TestCase
{
    use RefreshDatabase;

    private DomainService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        $this->service = app(DomainService::class);
    }

    public function test_normalises_user_input(): void
    {
        $this->assertSame('shop.example.am', $this->service->normalise('  HTTPS://Shop.Example.AM/path  '));
        $this->assertSame('shop.example.am', $this->service->normalise('shop.example.am:8080'));
        $this->assertSame('shop.example.am', $this->service->normalise('shop.example.am.'));
    }

    public function test_accepts_real_hostnames(): void
    {
        $this->assertTrue($this->service->isValidHostname('shop.example.am'));
        $this->assertTrue($this->service->isValidHostname('a.b.c.example.co.uk'));
    }

    public function test_rejects_things_that_are_not_hostnames(): void
    {
        $this->assertFalse($this->service->isValidHostname('localhost'));
        $this->assertFalse($this->service->isValidHostname('no spaces.am'));
        $this->assertFalse($this->service->isValidHostname('-bad.example.am'));
        $this->assertFalse($this->service->isValidHostname('bad-.example.am'));
        $this->assertFalse($this->service->isValidHostname(''));
    }

    public function test_platform_hosts_are_reserved(): void
    {
        $this->assertTrue($this->service->isReserved('yerevan.digital'));
        $this->assertTrue($this->service->isReserved('API.YEREVAN.DIGITAL'));
        $this->assertFalse($this->service->isReserved('shop.example.am'));
    }

    public function test_resolves_a_verified_active_store(): void
    {
        $store = Store::factory()->create([
            'custom_domain'             => 'shop.example.am',
            'custom_domain_verified_at' => now(),
            'status'                    => StoreStatus::Active,
        ]);

        $this->assertSame($store->slug, $this->service->resolveSlug('shop.example.am'));
    }

    public function test_resolution_is_case_and_port_insensitive(): void
    {
        $store = Store::factory()->create([
            'custom_domain'             => 'shop.example.am',
            'custom_domain_verified_at' => now(),
            'status'                    => StoreStatus::Active,
        ]);

        $this->assertSame($store->slug, $this->service->resolveSlug('SHOP.Example.AM:443'));
    }

    public function test_an_unverified_domain_never_resolves(): void
    {
        Store::factory()->create([
            'custom_domain'             => 'shop.example.am',
            'custom_domain_verified_at' => null,
            'status'                    => StoreStatus::Active,
        ]);

        // Otherwise claiming a hostname would be enough to serve content on it.
        $this->assertNull($this->service->resolveSlug('shop.example.am'));
    }

    public function test_a_suspended_store_stops_serving_its_domain(): void
    {
        Store::factory()->create([
            'custom_domain'             => 'shop.example.am',
            'custom_domain_verified_at' => now(),
            'status'                    => StoreStatus::Suspended,
        ]);

        $this->assertNull($this->service->resolveSlug('shop.example.am'));
    }

    public function test_reserved_and_unknown_hosts_do_not_resolve(): void
    {
        $this->assertNull($this->service->resolveSlug('yerevan.digital'));
        $this->assertNull($this->service->resolveSlug('nobody.example.am'));
        $this->assertNull($this->service->resolveSlug(''));
    }

    public function test_resolves_a_platform_subdomain_to_an_active_store(): void
    {
        Store::factory()->create([
            'slug'   => 'billing-test-store',
            'status' => StoreStatus::Active,
        ]);

        // No custom domain, no verification needed — the platform owns the parent.
        $this->assertSame('billing-test-store', $this->service->resolveSlug('billing-test-store.yerevan.digital'));
        // Case/port insensitive, same as any other host.
        $this->assertSame('billing-test-store', $this->service->resolveSlug('Billing-Test-Store.Yerevan.Digital:443'));
    }

    public function test_platform_subdomain_of_a_suspended_or_unknown_store_does_not_resolve(): void
    {
        Store::factory()->create([
            'slug'   => 'sleeping-store',
            'status' => StoreStatus::Suspended,
        ]);

        $this->assertNull($this->service->resolveSlug('sleeping-store.yerevan.digital'));
        $this->assertNull($this->service->resolveSlug('no-such-store.yerevan.digital'));
    }

    public function test_reserved_and_deep_platform_subdomains_never_resolve(): void
    {
        // Even if a store somehow had these slugs, the label is reserved.
        Store::factory()->create(['slug' => 'admin', 'status' => StoreStatus::Active]);

        $this->assertNull($this->service->resolveSlug('admin.yerevan.digital'));
        $this->assertNull($this->service->resolveSlug('www.yerevan.digital'));
        $this->assertNull($this->service->resolveSlug('api.yerevan.digital'));
        // Multi-level names under the platform host are not store subdomains.
        $this->assertNull($this->service->resolveSlug('a.b.yerevan.digital'));
    }

    public function test_suspending_a_store_busts_the_resolve_cache(): void
    {
        $store = Store::factory()->create([
            'custom_domain'             => 'shop.example.am',
            'custom_domain_verified_at' => now(),
            'status'                    => StoreStatus::Active,
        ]);

        // Warm the cache, then take the store down.
        $this->assertSame($store->slug, $this->service->resolveSlug('shop.example.am'));

        $store->update(['status' => StoreStatus::Suspended]);

        $this->assertNull($this->service->resolveSlug('shop.example.am'));
    }

    public function test_verification_record_name_is_prefixed(): void
    {
        config(['domains.verification_prefix' => '_yerevan-verify']);

        $this->assertSame(
            '_yerevan-verify.shop.example.am',
            $this->service->verificationRecordName('Shop.Example.AM'),
        );
    }

    public function test_ownership_fails_without_a_domain_or_token(): void
    {
        $store = Store::factory()->create(['custom_domain' => null]);

        $this->assertFalse($this->service->verifyOwnership($store));
    }

    public function test_ownership_matches_the_token_in_a_txt_record(): void
    {
        $store = Store::factory()->create([
            'custom_domain'       => 'shop.example.am',
            'custom_domain_token' => 'secret-token-value',
        ]);

        // Stub DNS: the real lookup is not something a test can rely on.
        $service = new class extends DomainService {
            public array $txt = [];

            public function lookupTxt(string $recordName): array
            {
                return $this->txt;
            }
        };

        $service->txt = ['  secret-token-value  '];
        $this->assertTrue($service->verifyOwnership($store));

        $service->txt = ['some-other-value'];
        $this->assertFalse($service->verifyOwnership($store));

        $service->txt = [];
        $this->assertFalse($service->verifyOwnership($store));
    }
}
