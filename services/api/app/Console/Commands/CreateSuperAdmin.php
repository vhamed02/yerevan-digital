<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class CreateSuperAdmin extends Command
{
    protected $signature = 'admin:create
        {email : Email address for the super admin account}
        {--name= : Display name (defaults to Super Admin)}
        {--password= : Password to set (a strong one is generated when omitted)}';

    protected $description = 'Create a super admin account, or promote an existing user to super admin';

    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email')));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error("Invalid email address: {$email}");

            return self::FAILURE;
        }

        $password = $this->option('password') ?: $this->generatePassword();

        $user = User::withTrashed()->where('email', $email)->first();

        if ($user) {
            if ($user->trashed()) {
                $user->restore();
            }

            $user->update([
                'name'     => $this->option('name') ?: $user->name,
                'password' => Hash::make($password),
                'role'     => UserRole::SuperAdmin,
                'status'   => UserStatus::Active,
            ]);
            $action = 'Promoted existing user to super admin';
        } else {
            $user = User::create([
                'name'     => $this->option('name') ?: 'Super Admin',
                'email'    => $email,
                'password' => Hash::make($password),
                'role'     => UserRole::SuperAdmin,
                'status'   => UserStatus::Active,
                'locale'   => 'en',
            ]);
            $action = 'Created new super admin';
        }

        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);

        if (! $user->hasRole('super-admin')) {
            $user->assignRole('super-admin');
        }

        $this->info($action . '.');
        $this->table(['Field', 'Value'], [
            ['Email', $user->email],
            ['Password', $password],
        ]);

        return self::SUCCESS;
    }

    private function generatePassword(int $length = 32): string
    {
        $sets = [
            'ABCDEFGHJKLMNPQRSTUVWXYZ',
            'abcdefghijkmnpqrstuvwxyz',
            '23456789',
            '!@#$%^&*()-_=+[]{}<>?',
        ];

        $chars = [];

        foreach ($sets as $set) {
            for ($i = 0; $i < 2; $i++) {
                $chars[] = $set[random_int(0, strlen($set) - 1)];
            }
        }

        $all = implode('', $sets);

        while (count($chars) < $length) {
            $chars[] = $all[random_int(0, strlen($all) - 1)];
        }

        for ($i = count($chars) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$chars[$i], $chars[$j]] = [$chars[$j], $chars[$i]];
        }

        return implode('', $chars);
    }
}
