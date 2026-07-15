<?php

namespace App\Observers;

use App\Models\Store;
use App\Services\DomainService;
use Illuminate\Support\Facades\Cache;

class StoreObserver
{
    /**
     * Drop the host -> slug cache whenever anything that gates domain routing
     * changes, so suspending a store (or moving its domain) takes effect now
     * rather than after the resolve TTL.
     */
    private function forgetDomains(Store $store): void
    {
        $domains = app(DomainService::class);

        $domains->forget($store->custom_domain);
        $domains->forget($store->getOriginal('custom_domain'));
    }

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

        $this->forgetDomains($store);

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
        $this->forgetDomains($store);
    }
}
