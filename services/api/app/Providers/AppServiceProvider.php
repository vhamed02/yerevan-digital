<?php

namespace App\Providers;

use App\Mail\Transport\BrevoTransport;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Mail::extend('brevo', function (array $config) {
            return new BrevoTransport($config['api_key'], new Client());
        });

        ResetPassword::createUrlUsing(function (User $user, string $token) {
            $frontend = rtrim(env('NEXT_PUBLIC_APP_URL', config('app.url')), '/');
            return $frontend . '/auth/reset-password?token=' . $token . '&email=' . urlencode($user->email);
        });
    }
}
