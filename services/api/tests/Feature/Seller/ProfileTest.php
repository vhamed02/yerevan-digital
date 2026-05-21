<?php

namespace Tests\Feature\Seller;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $seller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->seller = User::factory()->seller()->create([
            'name'     => 'Hayk Test',
            'email'    => 'hayk@example.com',
            'password' => bcrypt('OldPass123!'),
        ]);
        $this->seller->assignRole('seller');
    }

    private function actingAsSeller(): static
    {
        return $this->actingAs($this->seller, 'sanctum');
    }

    public function test_seller_can_view_own_profile(): void
    {
        $this->actingAsSeller()
            ->getJson('/api/v1/seller/profile')
            ->assertOk()
            ->assertJsonPath('data.name', 'Hayk Test')
            ->assertJsonPath('data.email', 'hayk@example.com');
    }

    public function test_profile_requires_auth(): void
    {
        $this->getJson('/api/v1/seller/profile')->assertUnauthorized();
    }

    public function test_seller_can_update_name_and_email(): void
    {
        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/profile', [
                'name'  => 'Hayk Updated',
                'email' => 'hayk.updated@example.com',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Hayk Updated')
            ->assertJsonPath('data.email', 'hayk.updated@example.com');

        $this->assertDatabaseHas('users', [
            'id'    => $this->seller->id,
            'name'  => 'Hayk Updated',
            'email' => 'hayk.updated@example.com',
        ]);
    }

    public function test_update_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/profile', [
                'name'  => 'Hayk Test',
                'email' => 'taken@example.com',
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['email']]);
    }

    public function test_update_allows_same_email_as_own(): void
    {
        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/profile', [
                'name'  => 'Hayk Renamed',
                'email' => 'hayk@example.com',
            ])
            ->assertOk();
    }

    public function test_update_requires_name_and_email(): void
    {
        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/profile', [])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['name', 'email']]);
    }

    public function test_seller_can_change_password(): void
    {
        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/profile/password', [
                'current_password'      => 'OldPass123!',
                'password'              => 'NewPass456!',
                'password_confirmation' => 'NewPass456!',
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertTrue(Hash::check('NewPass456!', $this->seller->fresh()->password));
    }

    public function test_change_password_fails_with_wrong_current_password(): void
    {
        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/profile/password', [
                'current_password'      => 'WrongPassword!',
                'password'              => 'NewPass456!',
                'password_confirmation' => 'NewPass456!',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false);
    }

    public function test_change_password_fails_when_confirmation_mismatch(): void
    {
        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/profile/password', [
                'current_password'      => 'OldPass123!',
                'password'              => 'NewPass456!',
                'password_confirmation' => 'Different789!',
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['password']]);
    }

    public function test_change_password_fails_when_too_short(): void
    {
        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/profile/password', [
                'current_password'      => 'OldPass123!',
                'password'              => 'short',
                'password_confirmation' => 'short',
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['password']]);
    }

    public function test_change_password_requires_auth(): void
    {
        $this->patchJson('/api/v1/seller/profile/password', [])->assertUnauthorized();
    }

    public function test_password_change_revokes_other_tokens(): void
    {
        $otherToken = $this->seller->createToken('other-device')->plainTextToken;

        $this->actingAsSeller()
            ->patchJson('/api/v1/seller/profile/password', [
                'current_password'      => 'OldPass123!',
                'password'              => 'NewPass456!',
                'password_confirmation' => 'NewPass456!',
            ])
            ->assertOk();

        $tokenId = explode('|', $otherToken)[0];
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
    }
}
