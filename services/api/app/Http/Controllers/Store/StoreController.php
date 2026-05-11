<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Resources\Store\PublicOrderResource;
use App\Http\Resources\Store\StoreInfoResource;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreTemplateConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StoreController extends Controller
{
    public function info(Request $request, string $slug): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $payload = Cache::remember("store:public:{$slug}", 300, function () use ($store) {
            $store->load([
                'paymentGateways' => fn($q) => $q->where('is_enabled', true)->with('gateway'),
            ]);

            $templateConfig = StoreTemplateConfig::where('store_id', $store->id)->first();

            return (new StoreInfoResource($store, $templateConfig?->config))->resolve();
        });

        return $this->success($payload);
    }

    public function categories(Request $request, string $slug): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $categories = Cache::remember("store:{$slug}:categories", 600, function () use ($store) {
            return Category::active()
                ->whereHas('products', fn($q) =>
                    $q->active()->where('store_id', $store->id)
                )
                ->withCount(['products as product_count' => fn($q) =>
                    $q->active()->where('store_id', $store->id)
                ])
                ->orderBy('sort_order')
                ->get()
                ->map(fn($cat) => [
                    'id'            => $cat->id,
                    'name'          => $cat->getTranslations('name'),
                    'slug'          => $cat->slug,
                    'product_count' => $cat->product_count,
                ]);
        });

        return $this->success($categories);
    }

    public function showOrder(Request $request, string $slug, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $order = Order::where('store_id', $store->id)
            ->where('uuid', $uuid)
            ->with('items')
            ->firstOrFail();

        return $this->success(new PublicOrderResource($order));
    }
}
