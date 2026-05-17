<?php

// v2
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin;
use App\Http\Controllers\Seller;
use App\Http\Controllers\Store;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\CaptchaController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PublicStoreController;
use App\Http\Controllers\StatsController;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsSeller;
use App\Http\Middleware\ResolveStore;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Route;

RateLimiter::for('api', fn($request) => Limit::perMinute(100)->by($request->ip()));
RateLimiter::for('auth', fn($request) => Limit::perMinute(5)->by($request->ip()));
RateLimiter::for('checkout', fn($request) => Limit::perMinute(10)->by($request->ip()));
RateLimiter::for('slug-check', fn($request) => Limit::perMinute(20)->by($request->ip()));
RateLimiter::for('contact', fn($request) => Limit::perMinute(3)->by($request->ip()));
RateLimiter::for('review',  fn($request) => Limit::perMinute(3)->by($request->ip()));

Route::prefix('v1')->group(function () {
    Route::get('health', [HealthController::class, 'check']);
    Route::get('stats', [StatsController::class, 'index']);
    Route::get('pages/{slug}', [PageController::class, 'show']);
    Route::get('stores', [PublicStoreController::class, 'index']);
    Route::get('stores/featured', [PublicStoreController::class, 'featured']);
    Route::get('stores/check-slug', [PublicStoreController::class, 'checkSlug'])->middleware('throttle:slug-check');
    Route::get('categories', [PublicStoreController::class, 'categories']);
    Route::post('contact', [ContactController::class, 'send'])->middleware('throttle:contact');
    Route::get('captcha', [CaptchaController::class, 'generate']);

    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    Route::prefix('admin')->middleware(['auth:sanctum', EnsureUserIsAdmin::class])->group(function () {
        Route::get('dashboard/stats', [Admin\DashboardController::class, 'stats']);

        Route::get('sellers', [Admin\SellerController::class, 'index']);
        Route::post('sellers', [Admin\SellerController::class, 'store']);
        Route::get('sellers/{seller}', [Admin\SellerController::class, 'show']);
        Route::patch('sellers/{seller}/status', [Admin\SellerController::class, 'updateStatus']);
        Route::put('sellers/{seller}/password', [Admin\SellerController::class, 'updatePassword']);
        Route::delete('sellers/{seller}', [Admin\SellerController::class, 'destroy']);

        Route::get('stores', [Admin\StoreController::class, 'index']);
        Route::post('stores', [Admin\StoreController::class, 'store']);
        Route::get('stores/{store}', [Admin\StoreController::class, 'show']);
        Route::patch('stores/{store}/approve', [Admin\StoreController::class, 'approve']);
        Route::patch('stores/{store}/suspend', [Admin\StoreController::class, 'suspend']);
        Route::patch('stores/{store}/feature', [Admin\StoreController::class, 'feature']);
        Route::delete('stores/{store}', [Admin\StoreController::class, 'destroy']);

        Route::get('categories', [Admin\CategoryController::class, 'index']);
        Route::post('categories', [Admin\CategoryController::class, 'store']);
        Route::put('categories/sort', [Admin\CategoryController::class, 'sort']);
        Route::patch('categories/{category}', [Admin\CategoryController::class, 'update']);
        Route::delete('categories/{category}', [Admin\CategoryController::class, 'destroy']);
        Route::post('categories/{category}/reorder', [Admin\CategoryController::class, 'reorder']);

        Route::get('templates', [Admin\TemplateController::class, 'index']);
        Route::post('templates', [Admin\TemplateController::class, 'store']);
        Route::patch('templates/{template}', [Admin\TemplateController::class, 'update']);
        Route::post('templates/{template}/image', [Admin\TemplateController::class, 'uploadImage']);
        Route::patch('templates/{template}/toggle', [Admin\TemplateController::class, 'toggle']);

        Route::get('payment-gateways', [Admin\PaymentGatewayController::class, 'index']);
        Route::patch('payment-gateways/{gateway}', [Admin\PaymentGatewayController::class, 'update']);
        Route::patch('payment-gateways/{gateway}/toggle', [Admin\PaymentGatewayController::class, 'toggle']);

        Route::get('settings', [Admin\SettingController::class, 'index']);
        Route::patch('settings', [Admin\SettingController::class, 'update']);

        Route::get('pages', [Admin\PageController::class, 'index']);
        Route::post('pages', [Admin\PageController::class, 'store']);
        Route::get('pages/{slug}', [Admin\PageController::class, 'show']);
        Route::put('pages/{slug}', [Admin\PageController::class, 'update']);
        Route::delete('pages/{slug}', [Admin\PageController::class, 'destroy']);

        Route::post('media/upload', [Admin\MediaController::class, 'upload']);

        Route::get('reviews', [Admin\ProductReviewController::class, 'index']);
        Route::patch('reviews/{review}/approve', [Admin\ProductReviewController::class, 'approve']);
        Route::delete('reviews/{review}', [Admin\ProductReviewController::class, 'destroy']);
    });

    Route::prefix('seller')->middleware(['auth:sanctum', EnsureUserIsSeller::class])->group(function () {
        Route::get('dashboard', Seller\DashboardController::class);

        Route::get('store', [Seller\StoreController::class, 'show']);
        Route::post('store', [Seller\StoreController::class, 'store']);
        Route::patch('store', [Seller\StoreController::class, 'update']);
        Route::post('store/logo', [Seller\StoreController::class, 'uploadLogo']);
        Route::post('store/banner', [Seller\StoreController::class, 'uploadBanner']);
        Route::post('store/favicon', [Seller\StoreController::class, 'uploadFavicon']);
        Route::get('store/stats', [Seller\StoreController::class, 'stats']);

        Route::get('store/template/available', [Seller\TemplateController::class, 'available']);
        Route::patch('store/template/active', [Seller\TemplateController::class, 'updateActive']);
        Route::get('store/template/config', [Seller\TemplateController::class, 'showConfig']);
        Route::patch('store/template/config', [Seller\TemplateController::class, 'updateConfig']);

        Route::get('products', [Seller\ProductController::class, 'index']);
        Route::post('products', [Seller\ProductController::class, 'store']);
        Route::get('products/check-slug', [Seller\ProductController::class, 'checkSlug']);
        Route::get('products/{uuid}', [Seller\ProductController::class, 'show']);
        Route::patch('products/{uuid}', [Seller\ProductController::class, 'update']);
        Route::delete('products/{uuid}', [Seller\ProductController::class, 'destroy']);
        Route::patch('products/{uuid}/status', [Seller\ProductController::class, 'updateStatus']);
        Route::post('products/{uuid}/images', [Seller\ProductController::class, 'uploadImages']);
        Route::patch('products/{uuid}/images/reorder', [Seller\ProductController::class, 'reorderImages']);
        Route::delete('products/{uuid}/images/{imageId}', [Seller\ProductController::class, 'deleteImage']);

        Route::get('products/{uuid}/variants', [Seller\ProductVariantController::class, 'index']);
        Route::post('products/{uuid}/variants', [Seller\ProductVariantController::class, 'store']);
        Route::get('products/{uuid}/variants/{variant}', [Seller\ProductVariantController::class, 'show']);
        Route::patch('products/{uuid}/variants/{variant}', [Seller\ProductVariantController::class, 'update']);
        Route::delete('products/{uuid}/variants/{variant}', [Seller\ProductVariantController::class, 'destroy']);

        Route::get('orders/export', [Seller\OrderController::class, 'export']);
        Route::get('orders', [Seller\OrderController::class, 'index']);
        Route::get('orders/{uuid}', [Seller\OrderController::class, 'show']);
        Route::patch('orders/{uuid}/status', [Seller\OrderController::class, 'updateStatus']);

        Route::get('payments/available', [Seller\PaymentController::class, 'available']);
        Route::get('payments/configured', [Seller\PaymentController::class, 'configured']);
        Route::post('payments/configure', [Seller\PaymentController::class, 'configure']);
        Route::patch('payments/{gatewayId}/toggle', [Seller\PaymentController::class, 'toggle']);
    });

    Route::post('store/payments/sandbox/complete', [Store\PaymentController::class, 'sandboxComplete']);

    Route::prefix('store')->middleware(ResolveStore::class)->group(function () {
        Route::get('{slug}/info', [Store\StoreController::class, 'info']);
        Route::get('{slug}/products', [Store\ProductController::class, 'index']);
        Route::get('{slug}/products/{productSlug}', [Store\ProductController::class, 'show']);
        Route::get('{slug}/categories', [Store\StoreController::class, 'categories']);
        Route::get('{slug}/orders/{uuid}', [Store\StoreController::class, 'showOrder']);
        Route::post('{slug}/checkout', [Store\CheckoutController::class, 'checkout'])->middleware('throttle:checkout');
        Route::post('{slug}/payments/initiate', [Store\PaymentController::class, 'initiate']);
        Route::post('{slug}/payments/callback/{gateway}', [Store\PaymentController::class, 'callback']);
        Route::post('{slug}/products/{productSlug}/reviews', [Store\ProductReviewController::class, 'store'])->middleware('throttle:review');
    });
});
