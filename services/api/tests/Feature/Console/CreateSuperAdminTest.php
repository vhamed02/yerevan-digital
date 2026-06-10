<?php

namespace Tests\Feature\Console;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateSuperAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);
    }

    public function test_creates_super_admin_with_generated_strong_password(): void
    {
        Artisan::call('admin:create', ['email' => 'owner@example.com']);
        $output = Artisan::output();

        $user = User::where('email', 'owner@example.com')->firstOrFail();

        $this->assertSame(UserRole::SuperAdmin, $user->role);
        $this->assertSame(UserStatus::Active, $user->status);
        $this->assertTrue($user->hasRole('super-admin'));
        $this->assertNotNull($user->email_verified_at);

        $this->assertSame(1, preg_match('/Password\s*\|\s*(\S+)/', $output, $m));
        $password = $m[1];

        $this->assertSame(32, strlen($password));
        $this->assertMatchesRegularExpression('/[A-Z]/', $password);
        $this->assertMatchesRegularExpression('/[a-z]/', $password);
        $this->assertMatchesRegularExpression('/[0-9]/', $password);
        $this->assertMatchesRegularExpression('/[^A-Za-z0-9]/', $password);
        $this->assertTrue(Hash::check($password, $user->password));
    }

    public function test_promotes_existing_user_with_provided_password(): void
    {
        $seller = User::factory()->create([
            'email' => 'seller@example.com',
            'role'  => UserRole::Seller,
        ]);

        $password = 'Provided#Password1234567890!ABCD';

        $this->artisan('admin:create', [
            'email'      => 'seller@example.com',
            '--password' => $password,
        ])->assertSuccessful();

        $seller->refresh();

        $this->assertSame(UserRole::SuperAdmin, $seller->role);
        $this->assertTrue($seller->hasRole('super-admin'));
        $this->assertTrue(Hash::check($password, $seller->password));
    }

    public function test_restores_soft_deleted_user_when_promoting(): void
    {
        $user = User::factory()->create(['email' => 'ghost@example.com', 'role' => UserRole::Seller]);
        $user->delete();

        $this->artisan('admin:create', ['email' => 'ghost@example.com'])->assertSuccessful();

        $this->assertNull($user->fresh()->deleted_at);
        $this->assertSame(UserRole::SuperAdmin, $user->fresh()->role);
    }

    public function test_rejects_invalid_email(): void
    {
        $this->artisan('admin:create', ['email' => 'not-an-email'])->assertFailed();

        $this->assertDatabaseCount('users', 0);
    }
}
