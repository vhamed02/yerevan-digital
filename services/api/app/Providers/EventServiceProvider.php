<?php

namespace App\Providers;

use App\Events\OrderStatusChanged;
use App\Events\PaymentSucceeded;
use App\Events\ProductViewed;
use App\Listeners\RecordProductView;
use App\Listeners\SendNewOrderNotifications;
use App\Listeners\SendOrderStatusNotification;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Observers\OrderObserver;
use App\Observers\ProductObserver;
use App\Observers\StoreObserver;
use App\Observers\UserObserver;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * Event to listener mappings.
     *
     * @var array<class-string, array<int, class-string>>
     */
    private array $listeners = [
        ProductViewed::class      => [RecordProductView::class],
        PaymentSucceeded::class   => [SendNewOrderNotifications::class],
        OrderStatusChanged::class => [SendOrderStatusNotification::class],
    ];

    /**
     * Model observers.
     *
     * @var array<class-string, class-string>
     */
    private array $observers = [
        User::class    => UserObserver::class,
        Store::class   => StoreObserver::class,
        Order::class   => OrderObserver::class,
        Product::class => ProductObserver::class,
    ];

    public function boot(): void
    {
        foreach ($this->listeners as $event => $listeners) {
            foreach ($listeners as $listener) {
                Event::listen($event, $listener);
            }
        }

        foreach ($this->observers as $model => $observer) {
            $model::observe($observer);
        }
    }
}
