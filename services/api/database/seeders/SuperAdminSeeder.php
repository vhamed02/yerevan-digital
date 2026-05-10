<?php

namespace Database\Seeders;

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
                'status'   => UserStatus::Active,
                'locale'   => 'hy',
            ]
        );

        $admin->assignRole('super-admin');
    }
}
