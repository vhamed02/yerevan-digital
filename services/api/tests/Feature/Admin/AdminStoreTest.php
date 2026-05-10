<?php

namespace Tests\Feature\Admin;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Models\Store;
use App\Models\User;
use App\Notifications\StoreApprovedNotification;
use App\Notifications\StoreSuspendedNotification;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdminStoreTest extends TestCase
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

    public function test_admin_can_list_stores(): void
    {
        Store::factory()->count(3)->create();

        $this->actingAsAdmin()
            ->getJson('/api/v1/admin/stores')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [['id', 'slug', 'name', 'status']],
                    'meta' => ['total'],
                ],
            ]);
    }

    public function test_admin_can_filter_stores_by_status(): void
    {
        Store::factory()->count(2)->create(['status' => StoreStatus::Active]);
        Store::factory()->count(1)->create(['status' => StoreStatus::Pending]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/admin/stores?status=pending')
            ->assertOk();

        $this->assertEquals(1, $response->json('data.meta.total'));
    }

    public function test_admin_can_view_store_detail(): void
    {
        $store = Store::factory()->create();

        $this->actingAsAdmin()
            ->getJson("/api/v1/admin/stores/{$store->slug}")
            ->assertOk()
            ->assertJsonPath('data.slug', $store->slug);
    }

    public function test_admin_can_approve_store(): void
    {
        Notification::fake();

        $seller = User::factory()->seller()->create();
        $seller->assignRole('seller');
        $store = Store::factory()->pending()->create(['user_id' => $seller->id]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/stores/{$store->slug}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('stores', ['id' => $store->id, 'status' => 'active']);
        Notification::assertSentTo($seller, StoreApprovedNotification::class);
    }

    public function test_admin_can_suspend_store(): void
    {
        Notification::fake();

        $seller = User::factory()->seller()->create();
        $seller->assignRole('seller');
        $store = Store::factory()->create(['user_id' => $seller->id]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/stores/{$store->slug}/suspend", ['reason' => 'Policy violation'])
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended');

        $this->assertDatabaseHas('stores', ['id' => $store->id, 'status' => 'suspended']);
        Notification::assertSentTo($seller, StoreSuspendedNotification::class);
    }

    public function test_admin_can_toggle_store_featured(): void
    {
        $store = Store::factory()->create(['is_featured' => false]);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/stores/{$store->slug}/feature")
            ->assertOk()
            ->assertJsonPath('data.is_featured', true);

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/stores/{$store->slug}/feature")
            ->assertOk()
            ->assertJsonPath('data.is_featured', false);
    }

    public function test_admin_can_delete_store(): void
    {
        $store = Store::factory()->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/v1/admin/stores/{$store->slug}")
            ->assertOk();

        $this->assertSoftDeleted('stores', ['id' => $store->id]);
    }

    public function test_unauthenticated_cannot_access_stores(): void
    {
        $this->getJson('/api/v1/admin/stores')
            ->assertStatus(401);
    }

    public function test_non_admin_cannot_manage_stores(): void
    {
        $seller = User::factory()->seller()->create();
        $seller->assignRole('seller');

        $this->actingAs($seller, 'sanctum')
            ->getJson('/api/v1/admin/stores')
            ->assertStatus(403);
    }
}
