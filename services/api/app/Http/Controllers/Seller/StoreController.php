<?php

namespace App\Http\Controllers\Seller;

use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\CreateStoreRequest;
use App\Http\Requests\Seller\UpdateStoreRequest;
use App\Http\Resources\Seller\StoreResource;
use App\Models\StoreSetting;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StoreController extends Controller
{
    public function __construct(
        private readonly ImageService               $imageService,
        private readonly ProductRepositoryInterface $products,
        private readonly OrderRepositoryInterface   $orders,
    ) {}

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
            return [
                'products' => $this->products->statusBreakdownByStore($store->id),
                'orders'   => $this->orders->statusBreakdownByStore($store->id),
                'revenue'  => array_merge(
                    $this->orders->revenueSummaryByStore($store->id),
                    ['currency' => $store->currency],
                ),
            ];
        });

        return $this->success($data);
    }
}
