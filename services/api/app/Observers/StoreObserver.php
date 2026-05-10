<?php

namespace App\Observers;

use App\Models\Store;
use Illuminate\Support\Facades\Cache;

class StoreObserver
{
    public function created(Store $store): void
    {
        Cache::tags(['admin:stats'])->flush();
    }

    public function updated(Store $store): void
    {
        Cache::tags(['admin:stats'])->flush();
        Cache::forget("store:slug:{$store->slug}");

        if ($store->wasChanged('slug') && $store->getOriginal('slug')) {
            Cache::forget('store:slug:' . $store->getOriginal('slug'));
        }
    }

    public function deleted(Store $store): void
    {
        Cache::tags(['admin:stats'])->flush();
        Cache::forget("store:slug:{$store->slug}");
    }
}
