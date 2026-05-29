<?php

namespace App\Providers;

use App\Mail\Transport\BrevoTransport;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Mail::extend('brevo', function (array $config) {
            return new BrevoTransport($config['api_key'], new Client());
        });

        ResetPasswordNotification::createUrlUsing(function (User $user, string $token) {
            $frontend = rtrim(config('app.frontend_url'), '/');
            return $frontend . '/auth/reset-password?token=' . $token . '&email=' . urlencode($user->email);
        });
    }
}
