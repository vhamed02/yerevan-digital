<?php

namespace Tests\Feature\Admin;

use App\Models\StoreSetting;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSettingTest extends TestCase
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

    public function test_admin_can_save_string_settings(): void
    {
        $this->actingAsAdmin()
            ->patchJson('/api/v1/admin/settings', [
                'settings' => ['platform_name' => 'Yerevan Digital', 'support_email' => 'hi@yerevan.digital'],
            ])
            ->assertOk()
            ->assertJsonPath('data.platform_name', 'Yerevan Digital');

        $this->assertDatabaseHas('store_settings', [
            'store_id' => null,
            'key'      => 'platform_name',
            'value'    => 'Yerevan Digital',
        ]);
    }

    /**
     * The admin UI sends JSON booleans for toggles. Before this was handled the
     * request rejected them against the `string` rule, so no toggle could save.
     */
    public function test_boolean_settings_are_stored_canonically(): void
    {
        $this->actingAsAdmin()
            ->patchJson('/api/v1/admin/settings', [
                'settings' => [
                    'registration_enabled'          => true,
                    'registration_require_approval' => false,
                ],
            ])
            ->assertOk();

        $this->assertSame('1', StoreSetting::platform()->where('key', 'registration_enabled')->value('value'));
        $this->assertSame('0', StoreSetting::platform()->where('key', 'registration_require_approval')->value('value'));
    }

    public function test_numeric_settings_are_stored_as_strings(): void
    {
        $this->actingAsAdmin()
            ->patchJson('/api/v1/admin/settings', ['settings' => ['smtp_port' => 587]])
            ->assertOk();

        $this->assertSame('587', StoreSetting::platform()->where('key', 'smtp_port')->value('value'));
    }

    public function test_settings_round_trip_through_the_index_endpoint(): void
    {
        $this->actingAsAdmin()
            ->patchJson('/api/v1/admin/settings', ['settings' => ['registration_enabled' => true]])
            ->assertOk();

        $this->actingAsAdmin()
            ->getJson('/api/v1/admin/settings')
            ->assertOk()
            ->assertJsonPath('data.registration_enabled', '1');
    }

    public function test_saving_updates_rather_than_duplicates(): void
    {
        $this->actingAsAdmin()
            ->patchJson('/api/v1/admin/settings', ['settings' => ['platform_name' => 'First']])
            ->assertOk();
        $this->actingAsAdmin()
            ->patchJson('/api/v1/admin/settings', ['settings' => ['platform_name' => 'Second']])
            ->assertOk();

        $this->assertSame(1, StoreSetting::platform()->where('key', 'platform_name')->count());
        $this->assertSame('Second', StoreSetting::platform()->where('key', 'platform_name')->value('value'));
    }

    public function test_a_bare_payload_without_the_settings_wrapper_is_rejected(): void
    {
        // Documents the contract the admin client must honour.
        $this->actingAsAdmin()
            ->patchJson('/api/v1/admin/settings', ['platform_name' => 'Nope'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('settings');
    }

    public function test_a_non_scalar_setting_value_is_rejected(): void
    {
        $this->actingAsAdmin()
            ->patchJson('/api/v1/admin/settings', ['settings' => ['platform_name' => ['a' => 'b']]])
            ->assertStatus(422);
    }

    public function test_a_seller_cannot_change_platform_settings(): void
    {
        $seller = User::factory()->seller()->create();
        $seller->assignRole('seller');

        $this->actingAs($seller, 'sanctum')
            ->patchJson('/api/v1/admin/settings', ['settings' => ['platform_name' => 'Hacked']])
            ->assertForbidden();
    }
}
