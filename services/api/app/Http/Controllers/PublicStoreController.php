<?php

namespace App\Http\Controllers;

use App\Enums\StoreStatus;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PublicStoreController extends Controller
{
    public function featured(): JsonResponse
    {
        $stores = Cache::remember('stores:featured', 900, function () {
            return Store::where('status', StoreStatus::Active)
                ->where('is_featured', true)
                ->with(['paymentGateways'])
                ->withCount('products')
                ->limit(6)
                ->get()
                ->map(fn($store) => [
                    'id'            => $store->id,
                    'slug'          => $store->slug,
                    'name'          => $store->getTranslations('name'),
                    'description'   => $store->getTranslations('description'),
                    'logo_url'      => $store->logo ? asset("storage/{$store->logo}") : null,
                    'banner_url'    => $store->banner ? asset("storage/{$store->banner}") : null,
                    'product_count' => $store->products_count,
                ]);
        });

        return $this->success($stores);
    }

    public function checkSlug(Request $request): JsonResponse
    {
        $request->validate([
            'slug' => ['required', 'string', 'regex:/^[a-z0-9-]+$/'],
        ]);

        $exists = Store::where('slug', $request->input('slug'))->exists();

        return $this->success(['available' => !$exists]);
    }
}
