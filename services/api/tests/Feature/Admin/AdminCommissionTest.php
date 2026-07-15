<?php

namespace Tests\Feature\Admin;

use App\Models\Commission;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCommissionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        config(['commission.default_rate' => '0.05']);

        $this->admin = User::factory()->admin()->create();
        $this->admin->assignRole('super-admin');
    }

    private function actingAsAdmin(): static
    {
        return $this->actingAs($this->admin, 'sanctum');
    }

    public function test_admin_can_list_the_commission_ledger(): void
    {
        $store = Store::factory()->create();
        Commission::factory()->count(3)->create([
            'store_id' => $store->id,
            'order_id' => fn () => Order::factory()->create(['store_id' => $store->id])->id,
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/admin/commissions')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['data' => [['uuid', 'type', 'rate', 'base_amount', 'amount', 'store']], 'meta'],
            ]);

        $this->assertCount(3, $response->json('data.data'));
    }

    public function test_ledger_can_be_filtered_by_store(): void
    {
        $mine  = Store::factory()->create();
        $other = Store::factory()->create();

        Commission::factory()->create([
            'store_id' => $mine->id,
            'order_id' => Order::factory()->create(['store_id' => $mine->id])->id,
        ]);
        Commission::factory()->create([
            'store_id' => $other->id,
            'order_id' => Order::factory()->create(['store_id' => $other->id])->id,
        ]);

        $response = $this->actingAsAdmin()
            ->getJson("/api/v1/admin/commissions?store_id={$mine->id}")
            ->assertOk();

        $this->assertCount(1, $response->json('data.data'));
    }

    public function test_summary_nets_accruals_against_reversals(): void
    {
        $store = Store::factory()->create();
        $order = Order::factory()->create(['store_id' => $store->id]);

        Commission::factory()->create([
            'store_id' => $store->id, 'order_id' => $order->id,
            'base_amount' => 20000, 'amount' => 1000,
        ]);
        Commission::factory()->reversal()->create([
            'store_id'    => $store->id,
            'order_id'    => Order::factory()->create(['store_id' => $store->id])->id,
            'base_amount' => 8000, 'amount' => -400,
        ]);

        $this->actingAsAdmin()
            ->getJson('/api/v1/admin/commissions/summary')
            ->assertOk()
            ->assertJsonPath('data.accrued', '1000.00')
            ->assertJsonPath('data.reversed', '-400.00')
            ->assertJsonPath('data.net', '600.00')
            ->assertJsonPath('data.default_rate', '0.05');
    }

    public function test_admin_can_set_a_per_store_commission_rate(): void
    {
        $store = Store::factory()->create(['commission_rate' => null]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/stores/{$store->slug}/commission-rate", ['commission_rate' => 0.025])
            ->assertOk()
            ->assertJsonPath('data.effective_rate', '0.0250');

        $this->assertSame('0.0250', $store->fresh()->commission_rate);
    }

    public function test_admin_can_clear_a_rate_to_fall_back_to_the_platform_default(): void
    {
        $store = Store::factory()->create(['commission_rate' => '0.0250']);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/stores/{$store->slug}/commission-rate", ['commission_rate' => null])
            ->assertOk()
            ->assertJsonPath('data.effective_rate', '0.05');

        $this->assertNull($store->fresh()->commission_rate);
    }

    public function test_an_out_of_range_rate_is_rejected(): void
    {
        $store = Store::factory()->create(['commission_rate' => null]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/stores/{$store->slug}/commission-rate", ['commission_rate' => 1.5])
            ->assertStatus(422)
            ->assertJsonValidationErrors('commission_rate');
    }

    public function test_store_detail_exposes_the_override_and_the_effective_rate(): void
    {
        $store = Store::factory()->create(['commission_rate' => null]);

        // Inheriting: no override, effective rate comes from the platform default.
        $this->actingAsAdmin()
            ->getJson("/api/v1/admin/stores/{$store->slug}")
            ->assertOk()
            ->assertJsonPath('data.commission_rate', null)
            ->assertJsonPath('data.effective_commission_rate', '0.05');

        $store->update(['commission_rate' => '0.0250']);

        // Overridden: both reflect the store's own rate.
        $this->actingAsAdmin()
            ->getJson("/api/v1/admin/stores/{$store->slug}")
            ->assertOk()
            ->assertJsonPath('data.commission_rate', '0.0250')
            ->assertJsonPath('data.effective_commission_rate', '0.0250');
    }

    public function test_platform_default_rate_can_be_set_through_settings(): void
    {
        $this->actingAsAdmin()
            ->patchJson('/api/v1/admin/settings', ['settings' => ['commission_rate' => '0.03']])
            ->assertOk();

        $this->actingAsAdmin()
            ->getJson('/api/v1/admin/commissions/summary')
            ->assertOk()
            ->assertJsonPath('data.default_rate', '0.03');
    }

    public function test_an_out_of_range_platform_default_rate_is_rejected(): void
    {
        $this->actingAsAdmin()
            ->patchJson('/api/v1/admin/settings', ['settings' => ['commission_rate' => '5']])
            ->assertStatus(422)
            ->assertJsonValidationErrors('settings.commission_rate');
    }

    public function test_a_seller_cannot_read_the_commission_ledger(): void
    {
        $seller = User::factory()->seller()->create();
        $seller->assignRole('seller');

        $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/admin/commissions')
            ->assertForbidden();
    }
}
