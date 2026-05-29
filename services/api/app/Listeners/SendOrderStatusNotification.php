<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Notifications\OrderStatusChangedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendOrderStatusNotification implements ShouldQueue
{
    public string $queue = 'notifications';

    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order;

        if ($order->customer) {
            $order->customer->notify(new OrderStatusChangedNotification($order));
        }
    }
}
