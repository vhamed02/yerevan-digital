<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Resources\Store\PublicOrderResource;
use App\Http\Resources\Store\StoreInfoResource;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\StoreTemplateConfigRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StoreController extends Controller
{
    public function __construct(
        private readonly CategoryRepositoryInterface           $categories,
        private readonly OrderRepositoryInterface              $orders,
        private readonly StoreTemplateConfigRepositoryInterface $configs,
    ) {}

    public function info(Request $request, string $slug): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $payload = Cache::remember("store:public:{$slug}", 300, function () use ($store) {
            $store->load([
                'paymentGateways' => fn($q) => $q->where('is_enabled', true)->with('gateway'),
            ]);

            $templateConfig = $this->configs->findByStore($store->id);

            return (new StoreInfoResource($store, $templateConfig?->config))->resolve();
        });

        return $this->success($payload);
    }

    public function categories(Request $request, string $slug): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $categories = Cache::remember("store:{$slug}:categories", 600, function () use ($store) {
            return $this->categories->activeForStore($store->id);
        });

        return $this->success($categories);
    }

    public function showOrder(Request $request, string $slug, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $order = $this->orders->findPublicByStoreAndUuid($store->id, $uuid, ['items']);

        return $this->success(new PublicOrderResource($order));
    }
}
