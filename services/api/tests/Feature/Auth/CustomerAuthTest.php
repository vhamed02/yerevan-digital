<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
    }

    public function test_customer_can_register_with_valid_data(): void
    {
        $response = $this->postJson('/api/v1/auth/customer/register', [
            'name'                  => 'Davit Sargsyan',
            'email'                 => 'davit@example.com',
            'password'              => 'Str0ng!Pass',
            'password_confirmation' => 'Str0ng!Pass',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'uuid', 'name', 'email', 'role'],
                    'token',
                    'token_type',
                ],
            ])
            ->assertJsonPath('data.user.role', 'customer')
            ->assertJsonPath('data.store', null);

        $user = User::where('email', 'davit@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('customer'));
    }

    public function test_customer_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/v1/auth/customer/register', [
            'name'                  => 'Davit Sargsyan',
            'email'                 => 'taken@example.com',
            'password'              => 'Str0ng!Pass',
            'password_confirmation' => 'Str0ng!Pass',
        ])->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['email']]);
    }

    public function test_registered_customer_can_login(): void
    {
        $this->postJson('/api/v1/auth/customer/register', [
            'name'                  => 'Davit Sargsyan',
            'email'                 => 'davit@example.com',
            'password'              => 'Str0ng!Pass',
            'password_confirmation' => 'Str0ng!Pass',
        ])->assertStatus(201);

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'davit@example.com',
            'password' => 'Str0ng!Pass',
        ])->assertOk()
            ->assertJsonPath('data.user.role', 'customer')
            ->assertJsonStructure(['data' => ['token']]);
    }
}
