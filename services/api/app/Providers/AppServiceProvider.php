<?php

namespace App\Providers;

use App\Mail\Transport\BrevoTransport;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Notifications\ResetPassword;
use App\Observers\OrderObserver;
use App\Observers\ProductObserver;
use App\Observers\StoreObserver;
use App\Observers\UserObserver;
use App\Repositories\Contracts\AdminSellerRepositoryInterface;
use App\Repositories\Contracts\AdminStoreRepositoryInterface;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\PageRepositoryInterface;
use App\Repositories\Contracts\PaymentGatewayRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\ProductReviewRepositoryInterface;
use App\Repositories\Contracts\ProductVariantRepositoryInterface;
use App\Repositories\Contracts\ProductViewRepositoryInterface;
use App\Repositories\Contracts\StorePaymentGatewayRepositoryInterface;
use App\Repositories\Contracts\StoreTemplateConfigRepositoryInterface;
use App\Repositories\Contracts\StoreTemplateRepositoryInterface;
use App\Repositories\Eloquent\AdminSellerRepository;
use App\Repositories\Eloquent\AdminStoreRepository;
use App\Repositories\Eloquent\CategoryRepository;
use App\Repositories\Eloquent\OrderRepository;
use App\Repositories\Eloquent\PageRepository;
use App\Repositories\Eloquent\PaymentGatewayRepository;
use App\Repositories\Eloquent\ProductRepository;
use App\Repositories\Eloquent\ProductReviewRepository;
use App\Repositories\Eloquent\ProductVariantRepository;
use App\Repositories\Eloquent\ProductViewRepository;
use App\Repositories\Eloquent\StorePaymentGatewayRepository;
use App\Repositories\Eloquent\StoreTemplateConfigRepository;
use App\Repositories\Eloquent\StoreTemplateRepository;
use App\Events\ProductViewed;
use App\Listeners\RecordProductView;
use App\Services\PaymentGateway\Gateways\ConverseBankGateway;
use App\Services\PaymentGateway\Gateways\IdramGateway;
use App\Services\PaymentGateway\Gateways\InnecobankGateway;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use GuzzleHttp\Client;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AdminSellerRepositoryInterface::class, AdminSellerRepository::class);
        $this->app->bind(AdminStoreRepositoryInterface::class, AdminStoreRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, ProductRepository::class);
        $this->app->bind(OrderRepositoryInterface::class, OrderRepository::class);
        $this->app->bind(CategoryRepositoryInterface::class, CategoryRepository::class);
        $this->app->bind(ProductReviewRepositoryInterface::class, ProductReviewRepository::class);
        $this->app->bind(PaymentGatewayRepositoryInterface::class, PaymentGatewayRepository::class);
        $this->app->bind(StorePaymentGatewayRepositoryInterface::class, StorePaymentGatewayRepository::class);
        $this->app->bind(StoreTemplateRepositoryInterface::class, StoreTemplateRepository::class);
        $this->app->bind(StoreTemplateConfigRepositoryInterface::class, StoreTemplateConfigRepository::class);
        $this->app->bind(PageRepositoryInterface::class, PageRepository::class);
        $this->app->bind(ProductVariantRepositoryInterface::class, ProductVariantRepository::class);
        $this->app->bind(ProductViewRepositoryInterface::class, ProductViewRepository::class);

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

        Event::listen(ProductViewed::class, RecordProductView::class);

        User::observe(UserObserver::class);
        Store::observe(StoreObserver::class);
        Order::observe(OrderObserver::class);
        Product::observe(ProductObserver::class);
    }
}
