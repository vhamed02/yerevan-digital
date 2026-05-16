<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@vendora.am'],
            [
                'name'     => 'Super Admin',
                'password' => Hash::make('password'),
                'role'     => UserRole::SuperAdmin,
                'status'   => UserStatus::Active,
                'locale'   => 'hy',
            ]
        );

        $admin->updateQuietly([
            'role'   => UserRole::SuperAdmin,
            'status' => UserStatus::Active,
        ]);

        $admin->assignRole('super-admin');
    }
}
