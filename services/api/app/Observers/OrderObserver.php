<?php

namespace App\Observers;

use App\Models\Order;
use Illuminate\Support\Facades\Cache;

class OrderObserver
{
    public function created(Order $order): void
    {
        Cache::tags(['admin:stats'])->flush();
    }

    public function updated(Order $order): void
    {
        Cache::tags(['admin:stats'])->flush();
    }

    public function deleted(Order $order): void
    {
        Cache::tags(['admin:stats'])->flush();
    }
}
