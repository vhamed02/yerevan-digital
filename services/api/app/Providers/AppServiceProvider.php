<?php

namespace App\Providers;

use App\Mail\Transport\BrevoTransport;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Notifications\ResetPassword;
use App\Observers\OrderObserver;
use App\Observers\StoreObserver;
use App\Observers\UserObserver;
use App\Repositories\Contracts\AdminSellerRepositoryInterface;
use App\Repositories\Contracts\AdminStoreRepositoryInterface;
use App\Repositories\Eloquent\AdminSellerRepository;
use App\Repositories\Eloquent\AdminStoreRepository;
use App\Services\PaymentGateway\Gateways\ConverseBankGateway;
use App\Services\PaymentGateway\Gateways\IdramGateway;
use App\Services\PaymentGateway\Gateways\InnecobankGateway;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use GuzzleHttp\Client;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AdminSellerRepositoryInterface::class, AdminSellerRepository::class);
        $this->app->bind(AdminStoreRepositoryInterface::class, AdminStoreRepository::class);

        $this->app->singleton(PaymentGatewayRegistry::class, function () {
            $registry = new PaymentGatewayRegistry();
            $registry->register('idram', new IdramGateway());
            $registry->register('innecobank', new InnecobankGateway());
            $registry->register('converse_bank', new ConverseBankGateway());
            return $registry;
        });
    }

    public function boot(): void
    {
        Mail::extend('brevo', function (array $config) {
            return new BrevoTransport($config['api_key'], new Client());
        });

        ResetPasswordNotification::createUrlUsing(function (User $user, string $token) {
            $frontend = rtrim(env('NEXT_PUBLIC_APP_URL', config('app.url')), '/');
            return $frontend . '/auth/reset-password?token=' . $token . '&email=' . urlencode($user->email);
        });

        User::observe(UserObserver::class);
        Store::observe(StoreObserver::class);
        Order::observe(OrderObserver::class);
    }
}
