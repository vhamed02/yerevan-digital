<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\PaymentSucceeded;
use App\Models\Order;
use App\Services\CommissionService;
use Illuminate\Support\Facades\DB;

class HandlePaymentSuccessAction
{
    public function __construct(
        private readonly CommissionService $commissions,
    ) {}

    public function execute(Order $order, string $paymentMethod): Order
    {
        $freshOrder = DB::transaction(function () use ($order, $paymentMethod) {
            $order->update([
                'payment_status' => PaymentStatus::Paid,
                'status'         => OrderStatus::Processing,
                'paid_at'        => now(),
                'payment_method' => $paymentMethod,
            ]);

            $freshOrder = $order->fresh();

            // Same transaction as the order flipping to paid: an order can never
            // be marked paid without its commission landing alongside it.
            $this->commissions->accrue($freshOrder);

            return $freshOrder;
        });

        // After commit, so queued listeners never observe uncommitted state.
        event(new PaymentSucceeded($freshOrder));

        return $freshOrder;
    }
}
