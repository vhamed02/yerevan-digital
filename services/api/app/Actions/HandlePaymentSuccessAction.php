<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\PaymentSucceeded;
use App\Models\Order;

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

        event(new PaymentSucceeded($freshOrder));

        return $freshOrder;
    }
}
