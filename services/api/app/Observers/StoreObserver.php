<?php

namespace App\Observers;

use App\Models\Store;
use Illuminate\Support\Facades\Cache;

class StoreObserver
{
    public function created(Store $store): void
    {
        Cache::tags(['admin:stats'])->flush();
        Cache::forget('platform:stats');
        Cache::forget('stores:featured');
    }

    public function updated(Store $store): void
    {
        Cache::tags(['admin:stats'])->flush();
        Cache::forget('platform:stats');
        Cache::forget('stores:featured');
        Cache::forget("store:slug:{$store->slug}");
        Cache::forget("store:public:{$store->slug}");

        if ($store->wasChanged('slug') && $store->getOriginal('slug')) {
            $oldSlug = $store->getOriginal('slug');
            Cache::forget("store:slug:{$oldSlug}");
            Cache::forget("store:public:{$oldSlug}");
        }
    }

    public function deleted(Store $store): void
    {
        Cache::tags(['admin:stats'])->flush();
        Cache::forget('platform:stats');
        Cache::forget('stores:featured');
        Cache::forget("store:slug:{$store->slug}");
        Cache::forget("store:public:{$store->slug}");
    }
}
