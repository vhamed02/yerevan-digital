<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SuspendStoreRequest;
use App\Http\Resources\Admin\StoreDetailResource;
use App\Http\Resources\Admin\StoreResource;
use App\Notifications\StoreApprovedNotification;
use App\Notifications\StoreSuspendedNotification;
use App\Repositories\Contracts\AdminStoreRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function __construct(private readonly AdminStoreRepositoryInterface $stores) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'featured', 'search']);
        $stores = $this->stores->paginate($filters);

        return $this->paginated(StoreResource::collection($stores));
    }

    public function show(string $store): JsonResponse
    {
        $store = $this->stores->findBySlugWithDetails($store);

        return $this->success(new StoreDetailResource($store));
    }

    public function approve(string $store): JsonResponse
    {
        $store = $this->stores->approve($store);
        $store->owner->notify(new StoreApprovedNotification($store));

        return $this->success(new StoreResource($store), 'Store approved.');
    }

    public function suspend(SuspendStoreRequest $request, string $store): JsonResponse
    {
        $reason = $request->validated()['reason'] ?? null;
        $store = $this->stores->suspend($store, $reason);
        $store->owner->notify(new StoreSuspendedNotification($store, $reason));

        return $this->success(new StoreResource($store), 'Store suspended.');
    }

    public function feature(string $store): JsonResponse
    {
        $store = $this->stores->toggleFeatured($store);

        $message = $store->is_featured ? 'Store marked as featured.' : 'Store removed from featured.';

        return $this->success(new StoreResource($store), $message);
    }

    public function destroy(string $store): JsonResponse
    {
        $this->stores->softDelete($store);

        return $this->success(null, 'Store deleted.');
    }
}
