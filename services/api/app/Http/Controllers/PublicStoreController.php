<?php

namespace App\Http\Controllers;

use App\Enums\StoreStatus;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PublicStoreController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sort    = $request->input('sort', 'newest');
        $perPage = min((int) $request->input('per_page', 12), 48);

        $query = Store::where('status', StoreStatus::Active)
            ->withCount('products');

        match ($sort) {
            'popular' => $query->orderByDesc('products_count'),
            'oldest'  => $query->orderBy('created_at'),
            default   => $query->orderByDesc('created_at'),
        };

        $paginated = $query->paginate($perPage);

        $items = collect($paginated->items())->map(fn($store) => [
            'id'            => $store->id,
            'slug'          => $store->slug,
            'name'          => $store->getTranslations('name'),
            'logo_url'      => $store->logo   ? asset("storage/{$store->logo}")   : null,
            'banner_url'    => $store->banner  ? asset("storage/{$store->banner}") : null,
            'product_count' => $store->products_count,
            'category'      => null,
        ])->values()->all();

        return $this->success([
            'data' => $items,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
        ]);
    }

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
                ])
                ->values()
                ->all();
        });

        return $this->success($stores);
    }

    public function categories(): JsonResponse
    {
        $categories = \App\Models\Category::active()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'name', 'slug', 'parent_id', 'icon'])
            ->map(fn($c) => [
                'id'        => $c->id,
                'name'      => $c->getTranslations('name'),
                'slug'      => $c->slug,
                'parent_id' => $c->parent_id,
                'icon'      => $c->icon,
            ])
            ->values()
            ->all();

        return $this->success($categories);
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
