<?php

namespace App\Listeners;

use App\Events\PaymentSucceeded;
use App\Notifications\CustomerOrderConfirmationNotification;
use App\Notifications\NewOrderNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;

class SendNewOrderNotifications implements ShouldQueue
{
    public string $queue = 'notifications';

    public function handle(PaymentSucceeded $event): void
    {
        $order = $event->order;

        $order->store->owner->notify(new NewOrderNotification($order));

        Notification::route('mail', [
            $order->customer_email => $order->customer_name,
        ])->notify(new CustomerOrderConfirmationNotification($order));
    }
}
