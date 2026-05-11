<?php

namespace App\Http\Controllers\Seller;

use App\Enums\OrderStatus;
use App\Enums\ProductStatus;
use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\CreateStoreRequest;
use App\Http\Requests\Seller\UpdateStoreRequest;
use App\Http\Resources\Seller\StoreResource;
use App\Models\StoreSetting;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StoreController extends Controller
{
    public function __construct(private readonly ImageService $imageService) {}

    public function show(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');

        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        return $this->success(new StoreResource($store));
    }

    public function store(CreateStoreRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($request->attributes->get('sellerStore')) {
            return $this->error('You already have a store.', 422);
        }

        $approvalRequired = StoreSetting::platform()
            ->where('key', 'store_approval_required')
            ->value('value');

        $status = $approvalRequired === 'true' ? StoreStatus::Pending : StoreStatus::Active;

        $store = $user->store()->create(array_merge($request->validated(), [
            'status'   => $status,
            'currency' => 'AMD',
        ]));

        return $this->success(new StoreResource($store), 'Store created.', 201);
    }

    public function update(UpdateStoreRequest $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');

        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $store->update($request->validated());
        Cache::forget("store:slug:{$store->slug}");

        return $this->success(new StoreResource($store->fresh()), 'Store updated.');
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate(['image' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120']]);

        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $variants = $this->imageService->process($request->file('image'), 'stores', (string) $store->id);
        $store->update(['logo' => $variants['original']]);
        Cache::forget("store:slug:{$store->slug}");

        return $this->success(['logo' => $store->logo], 'Logo uploaded.');
    }

    public function uploadBanner(Request $request): JsonResponse
    {
        $request->validate(['image' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:10240']]);

        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $variants = $this->imageService->process($request->file('image'), 'stores', (string) $store->id);
        $store->update(['banner' => $variants['original']]);
        Cache::forget("store:slug:{$store->slug}");

        return $this->success(['banner' => $store->banner], 'Banner uploaded.');
    }

    public function uploadFavicon(Request $request): JsonResponse
    {
        $request->validate(['image' => ['required', 'image', 'mimes:jpeg,png,webp,gif', 'max:1024']]);

        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $variants = $this->imageService->process($request->file('image'), 'stores', (string) $store->id);
        $store->update(['favicon' => $variants['thumbnail']]);
        Cache::forget("store:slug:{$store->slug}");

        return $this->success(['favicon' => $store->favicon], 'Favicon uploaded.');
    }

    public function stats(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $data = Cache::remember("store:{$store->id}:stats", 180, function () use ($store) {
            $products = DB::table('products')
                ->where('store_id', $store->id)
                ->whereNull('deleted_at')
                ->selectRaw('
                    COUNT(*) as total,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as draft,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as archived
                ', [
                    ProductStatus::Active->value,
                    ProductStatus::Draft->value,
                    ProductStatus::Archived->value,
                ])
                ->first();

            $orderStats = DB::table('orders')
                ->where('store_id', $store->id)
                ->whereNull('deleted_at')
                ->selectRaw('
                    COUNT(*) as total,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as processing,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as shipped,
                    SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
                ', [
                    OrderStatus::Pending->value,
                    OrderStatus::Processing->value,
                    OrderStatus::Shipped->value,
                ])
                ->first();

            $revenue = DB::table('orders')
                ->where('store_id', $store->id)
                ->whereNull('deleted_at')
                ->selectRaw('
                    SUM(total) as total,
                    SUM(CASE WHEN MONTH(created_at) = ? AND YEAR(created_at) = ? THEN total ELSE 0 END) as this_month,
                    SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END) as today
                ', [now()->month, now()->year])
                ->first();

            return [
                'products' => [
                    'total'    => (int) ($products->total ?? 0),
                    'active'   => (int) ($products->active ?? 0),
                    'draft'    => (int) ($products->draft ?? 0),
                    'archived' => (int) ($products->archived ?? 0),
                ],
                'orders' => [
                    'total'      => (int) ($orderStats->total ?? 0),
                    'pending'    => (int) ($orderStats->pending ?? 0),
                    'processing' => (int) ($orderStats->processing ?? 0),
                    'shipped'    => (int) ($orderStats->shipped ?? 0),
                    'today'      => (int) ($orderStats->today ?? 0),
                ],
                'revenue' => [
                    'total'      => (float) ($revenue->total ?? 0),
                    'this_month' => (float) ($revenue->this_month ?? 0),
                    'today'      => (float) ($revenue->today ?? 0),
                    'currency'   => $store->currency,
                ],
            ];
        });

        return $this->success($data);
    }
}
