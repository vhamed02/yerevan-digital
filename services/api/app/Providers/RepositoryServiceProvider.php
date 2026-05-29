<?php

namespace App\Providers;

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
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Repository contracts mapped to their Eloquent implementations.
     *
     * Declared via the framework's `$bindings` convention so each pair is
     * registered as a simple container binding without a manual register() body.
     *
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        AdminSellerRepositoryInterface::class         => AdminSellerRepository::class,
        AdminStoreRepositoryInterface::class          => AdminStoreRepository::class,
        ProductRepositoryInterface::class             => ProductRepository::class,
        OrderRepositoryInterface::class               => OrderRepository::class,
        CategoryRepositoryInterface::class            => CategoryRepository::class,
        ProductReviewRepositoryInterface::class       => ProductReviewRepository::class,
        PaymentGatewayRepositoryInterface::class      => PaymentGatewayRepository::class,
        StorePaymentGatewayRepositoryInterface::class => StorePaymentGatewayRepository::class,
        StoreTemplateRepositoryInterface::class       => StoreTemplateRepository::class,
        StoreTemplateConfigRepositoryInterface::class => StoreTemplateConfigRepository::class,
        PageRepositoryInterface::class                => PageRepository::class,
        ProductVariantRepositoryInterface::class      => ProductVariantRepository::class,
        ProductViewRepositoryInterface::class         => ProductViewRepository::class,
    ];
}
