<?php

namespace App\Events;

use App\Models\Order;

class PaymentSucceeded
{
    public function __construct(public readonly Order $order) {}
}
