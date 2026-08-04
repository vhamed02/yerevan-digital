<?php

namespace Tests\Feature\Admin;

use App\Models\PaymentGateway;
use App\Models\User;
use App\Services\PaymentGateway\Contracts\UnimplementedGateway;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use Database\Seeders\PaymentGatewaySeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AdminPaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->admin = User::factory()->admin()->create();
        $this->admin->assignRole('super-admin');
    }

    private function actingAsAdmin(): static
    {
        return $this->actingAs($this->admin, 'sanctum');
    }

    public function test_admin_can_list_gateways(): void
    {
        PaymentGateway::factory()->count(2)->create();

        $this->actingAsAdmin()
            ->getJson('/api/v1/admin/payment-gateways')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'name', 'is_active']]]);
    }

    public function test_admin_can_deactivate_a_working_gateway(): void
    {
        $gateway = PaymentGateway::factory()->create(['name' => 'idram', 'is_active' => true]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/payment-gateways/{$gateway->id}/toggle")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_admin_can_reactivate_a_working_gateway(): void
    {
        $gateway = PaymentGateway::factory()->create(['name' => 'idram', 'is_active' => false]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/payment-gateways/{$gateway->id}/toggle")
            ->assertOk()
            ->assertJsonPath('data.is_active', true);
    }

    // ------------------------------------------------- unimplemented gateways

    public static function placeholderProvider(): array
    {
        return [['ineco'], ['converse']];
    }

    #[DataProvider('placeholderProvider')]
    public function test_a_placeholder_gateway_cannot_be_activated(string $name): void
    {
        $gateway = PaymentGateway::factory()->create(['name' => $name, 'is_active' => false]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/payment-gateways/{$gateway->id}/toggle")
            ->assertStatus(422);

        $this->assertFalse($gateway->fresh()->is_active);
    }

    /** Turning one off must never be blocked, whatever state it got into. */
    public function test_a_placeholder_gateway_can_still_be_deactivated(): void
    {
        $gateway = PaymentGateway::factory()->create(['name' => 'ineco', 'is_active' => true]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/payment-gateways/{$gateway->id}/toggle")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_a_gateway_with_no_registered_implementation_cannot_be_activated(): void
    {
        $gateway = PaymentGateway::factory()->create(['name' => 'ameriabank', 'is_active' => false]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/payment-gateways/{$gateway->id}/toggle")
            ->assertStatus(422);

        $this->assertFalse($gateway->fresh()->is_active);
    }

    // -------------------------------------------------------- wiring invariants

    /**
     * CLAUDE.md's load-bearing rule: Store\PaymentController resolves a store's
     * gateway by DB name and then fetches that same key from the registry, so a
     * seeded name with no matching key is a live 500 waiting to happen.
     */
    public function test_every_seeded_gateway_name_matches_a_registry_key(): void
    {
        $this->seed(PaymentGatewaySeeder::class);
        $registry = app(PaymentGatewayRegistry::class);

        foreach (PaymentGateway::pluck('name') as $name) {
            $this->assertTrue($registry->has($name), "no gateway registered under '{$name}'");
        }
    }

    public function test_registry_keys_match_the_gateways_own_names(): void
    {
        foreach (app(PaymentGatewayRegistry::class)->all() as $key => $gateway) {
            $this->assertSame($key, $gateway->getName(), "gateway registered as '{$key}'");
        }
    }

    public function test_the_two_bank_stubs_are_marked_unimplemented(): void
    {
        $registry = app(PaymentGatewayRegistry::class);

        $this->assertInstanceOf(UnimplementedGateway::class, $registry->get('ineco'));
        $this->assertInstanceOf(UnimplementedGateway::class, $registry->get('converse'));
    }

    public function test_the_live_gateways_are_not_marked_unimplemented(): void
    {
        $registry = app(PaymentGatewayRegistry::class);

        $this->assertNotInstanceOf(UnimplementedGateway::class, $registry->get('idram'));
        $this->assertNotInstanceOf(UnimplementedGateway::class, $registry->get('telcell'));
    }

    /**
     * Deploys migrate but never seed, so a gateway that exists only in the
     * seeder never reaches production. Telcell shipped complete on 2026-07-17
     * but had no row on the live server until 2026-08-04 — silently, because a
     * missing row does not error, the payment option simply never appears.
     *
     * Asserted against the migrated baseline with **no seeding**, which is
     * exactly what a deploy produces.
     */
    public function test_telcell_row_comes_from_a_migration_not_only_the_seeder(): void
    {
        $telcell = PaymentGateway::where('name', 'telcell')->first();

        $this->assertNotNull($telcell, 'no telcell row exists after migrating without seeding');
        $this->assertTrue((bool) $telcell->is_active);
    }

    /**
     * A flat array of strings renders zero inputs in the seller config UI, so
     * the gateway silently becomes impossible to configure. Idram carried that
     * shape until 2026-08-04.
     */
    public function test_live_gateway_rows_use_the_structured_required_fields_shape(): void
    {
        $this->seed(PaymentGatewaySeeder::class);

        foreach (['idram', 'telcell'] as $name) {
            $fields = PaymentGateway::where('name', $name)->value('required_fields');

            $this->assertNotEmpty($fields, "'{$name}' has no required_fields");

            foreach ($fields as $field) {
                $this->assertIsArray($field, "'{$name}' uses the legacy flat required_fields shape");
                $this->assertArrayHasKey('key', $field);
                $this->assertArrayHasKey('label_en', $field);
            }
        }
    }

    public function test_the_seeder_leaves_both_stubs_inactive(): void
    {
        $this->seed(PaymentGatewaySeeder::class);

        $this->assertFalse(PaymentGateway::where('name', 'ineco')->value('is_active'));
        $this->assertFalse(PaymentGateway::where('name', 'converse')->value('is_active'));
    }

    public function test_a_seller_never_sees_a_placeholder_gateway(): void
    {
        $this->seed(PaymentGatewaySeeder::class);

        $seller = User::factory()->seller()->create();
        $seller->assignRole('seller');
        \App\Models\Store::factory()->create(['user_id' => $seller->id]);

        $names = collect(
            $this->actingAs($seller, 'sanctum')
                ->getJson('/api/v1/seller/payments/available')
                ->assertOk()
                ->json('data')
        )->pluck('name');

        $this->assertNotContains('ineco', $names);
        $this->assertNotContains('converse', $names);
    }

    public function test_unauthenticated_cannot_toggle_a_gateway(): void
    {
        $gateway = PaymentGateway::factory()->create(['name' => 'ineco', 'is_active' => false]);

        $this->patchJson("/api/v1/admin/payment-gateways/{$gateway->id}/toggle")
            ->assertStatus(401);
    }
}
