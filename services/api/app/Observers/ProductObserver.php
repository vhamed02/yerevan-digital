<?php

namespace App\Observers;

use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class ProductObserver
{
    public function saved(Product $product): void
    {
        $this->flushStoreProductCache($product);
        Cache::forget('platform:stats');
    }

    public function deleted(Product $product): void
    {
        $this->flushStoreProductCache($product);
        Cache::forget('platform:stats');
    }

    private function flushStoreProductCache(Product $product): void
    {
        if (!$product->store) {
            $product->load('store');
        }

        $slug = $product->store?->slug;
        if (!$slug) {
            return;
        }

        Cache::forget("store:{$slug}:product:{$product->slug}");
        Cache::forget("store:{$slug}:categories");
        $this->flushProductListCaches($slug);
    }

    private function flushProductListCaches(string $slug): void
    {
        $pattern = "*store:{$slug}:products:*";
        $redis   = Cache::getStore();

        if (method_exists($redis, 'connection')) {
            $redis->connection()->eval(
                "local keys = redis.call('keys', ARGV[1]) for _,k in ipairs(keys) do redis.call('del', k) end return #keys",
                0,
                $pattern
            );
        }
    }
}
