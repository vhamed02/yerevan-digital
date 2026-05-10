<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Store;
use App\Models\User;
use App\Notifications\StoreSuspendedNotification;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdminSellerTest extends TestCase
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

    public function test_admin_can_list_sellers(): void
    {
        User::factory()->seller()->count(3)->create();

        $this->actingAsAdmin()
            ->getJson('/api/v1/admin/sellers')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [['id', 'name', 'email', 'status']],
                    'meta' => ['total', 'per_page'],
                ],
            ]);
    }

    public function test_admin_can_filter_sellers_by_status(): void
    {
        User::factory()->seller()->count(2)->create();
        User::factory()->seller()->suspended()->count(1)->create();

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/admin/sellers?status=active')
            ->assertOk();

        $this->assertEquals(2, $response->json('data.meta.total'));
    }

    public function test_admin_can_search_sellers(): void
    {
        User::factory()->seller()->create(['name' => 'Anna Hakobyan', 'email' => 'anna@test.com']);
        User::factory()->seller()->create(['name' => 'Aram Petrosyan', 'email' => 'aram@test.com']);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/admin/sellers?search=Anna')
            ->assertOk();

        $this->assertEquals(1, $response->json('data.meta.total'));
        $this->assertEquals('Anna Hakobyan', $response->json('data.data.0.name'));
    }

    public function test_admin_can_view_seller_detail(): void
    {
        $seller = User::factory()->seller()->create();

        $this->actingAsAdmin()
            ->getJson("/api/v1/admin/sellers/{$seller->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $seller->id)
            ->assertJsonPath('data.email', $seller->email);
    }

    public function test_admin_can_suspend_seller(): void
    {
        Notification::fake();

        $seller = User::factory()->seller()->create();
        $store = Store::factory()->create(['user_id' => $seller->id]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/sellers/{$seller->id}/status", ['status' => 'suspended'])
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended');

        $this->assertDatabaseHas('users', ['id' => $seller->id, 'status' => 'suspended']);
        Notification::assertSentTo($seller, StoreSuspendedNotification::class);
    }

    public function test_admin_can_activate_seller(): void
    {
        Notification::fake();

        $seller = User::factory()->seller()->suspended()->create();

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/sellers/{$seller->id}/status", ['status' => 'active'])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');
    }

    public function test_update_status_requires_valid_status(): void
    {
        $seller = User::factory()->seller()->create();

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/sellers/{$seller->id}/status", ['status' => 'invalid'])
            ->assertStatus(422);
    }

    public function test_admin_can_delete_seller(): void
    {
        $seller = User::factory()->seller()->create();
        $store = Store::factory()->create(['user_id' => $seller->id]);

        $this->actingAsAdmin()
            ->deleteJson("/api/v1/admin/sellers/{$seller->id}")
            ->assertOk();

        $this->assertSoftDeleted('users', ['id' => $seller->id]);
        $this->assertSoftDeleted('stores', ['id' => $store->id]);
    }

    public function test_unauthenticated_cannot_access_sellers(): void
    {
        $this->getJson('/api/v1/admin/sellers')
            ->assertStatus(401);
    }

    public function test_non_admin_cannot_access_sellers(): void
    {
        $seller = User::factory()->seller()->create();
        $seller->assignRole('seller');

        $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/admin/sellers')
            ->assertStatus(403);
    }
}
