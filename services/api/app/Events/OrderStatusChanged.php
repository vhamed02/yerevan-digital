<?php

namespace App\Events;

use App\Models\Order;

class OrderStatusChanged
{
    public function __construct(public readonly Order $order) {}
}
