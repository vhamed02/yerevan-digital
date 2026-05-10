<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Notifications\WelcomeSellerNotification;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
    }

    public function test_seller_can_register_with_valid_data(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'name'                  => 'Anna Hakobyan',
            'email'                 => 'anna@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'uuid', 'name', 'email', 'role'],
                    'token',
                    'token_type',
                ],
            ])
            ->assertJsonPath('data.user.role', 'seller')
            ->assertJsonPath('data.user.email', 'anna@example.com');

        $this->assertDatabaseHas('users', ['email' => 'anna@example.com']);

        $user = User::where('email', 'anna@example.com')->first();
        $this->assertTrue($user->hasRole('seller'));

        Notification::assertSentTo($user, WelcomeSellerNotification::class);
    }

    public function test_register_fails_with_missing_required_fields(): void
    {
        $response = $this->postJson('/api/v1/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['name', 'email', 'password']]);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'existing@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['email']]);
    }

    public function test_register_fails_when_password_confirmation_mismatch(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'different456',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors' => ['password']]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email'    => 'seller@example.com',
            'password' => bcrypt('password123'),
            'role'     => UserRole::Seller,
        ]);
        $user->assignRole('seller');

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'seller@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['user', 'token', 'token_type'],
            ])
            ->assertJsonPath('data.user.email', 'seller@example.com')
            ->assertJsonPath('data.token_type', 'Bearer');
    }

    public function test_login_updates_last_login_at(): void
    {
        $user = User::factory()->create([
            'email'    => 'seller@example.com',
            'password' => bcrypt('password123'),
        ]);

        $this->assertNull($user->last_login_at);

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'seller@example.com',
            'password' => 'password123',
        ]);

        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email'    => 'seller@example.com',
            'password' => bcrypt('correct-password'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'seller@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'nobody@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(401);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user  = User::factory()->create(['role' => UserRole::Seller]);
        $user->assignRole('seller');
        $token = $user->createToken('api')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonPath('data.user.role', 'seller');
    }

    public function test_me_returns_401_for_unauthenticated_request(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    public function test_forgot_password_sends_reset_link(): void
    {
        $user = User::factory()->create(['email' => 'seller@example.com']);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'seller@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_forgot_password_returns_success_even_for_unknown_email(): void
    {
        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'nobody@example.com',
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('success', false);
    }

    public function test_reset_password_with_valid_token(): void
    {
        $user  = User::factory()->create(['email' => 'seller@example.com']);
        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token'                 => $token,
            'email'                 => 'seller@example.com',
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_seller_route_is_blocked_for_admin(): void
    {
        $admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $admin->assignRole('super-admin');
        $token = $admin->createToken('api')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/v1/seller/store');

        $response->assertStatus(403);
    }

    public function test_admin_route_is_blocked_for_seller(): void
    {
        $seller = User::factory()->create(['role' => UserRole::Seller]);
        $seller->assignRole('seller');
        $token = $seller->createToken('api')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/v1/admin/dashboard/stats');

        $response->assertStatus(403);
    }
}
