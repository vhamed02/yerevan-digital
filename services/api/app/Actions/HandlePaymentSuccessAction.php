<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Notifications\CustomerOrderConfirmationNotification;
use App\Notifications\NewOrderNotification;
use Illuminate\Support\Facades\Notification;

class HandlePaymentSuccessAction
{
    public function execute(Order $order, string $paymentMethod): Order
    {
        $order->update([
            'payment_status' => PaymentStatus::Paid,
            'status'         => OrderStatus::Processing,
            'paid_at'        => now(),
            'payment_method' => $paymentMethod,
        ]);

        $freshOrder = $order->fresh();

        $order->store->owner->notify(new NewOrderNotification($freshOrder));

        Notification::route('mail', [
            $freshOrder->customer_email => $freshOrder->customer_name,
        ])->notify(new CustomerOrderConfirmationNotification($freshOrder));

        return $freshOrder;
    }
}
