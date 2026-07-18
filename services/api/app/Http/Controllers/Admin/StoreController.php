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

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'seller_id'           => ['required', 'integer', 'exists:users,id'],
            'name.hy'             => ['required', 'string', 'max:200'],
            'name.en'             => ['required', 'string', 'max:200'],
            'slug'                => ['required', 'string', 'max:100', 'unique:stores,slug', 'regex:/^[a-z0-9-]+$/', \Illuminate\Validation\Rule::notIn(config('domains.reserved_subdomains', []))],
            'status'              => ['sometimes', 'in:pending,active,suspended'],
            'active_template_key' => ['sometimes', 'string', 'max:50'],
            'primary_color'       => ['sometimes', 'string', 'max:20'],
            'currency'            => ['sometimes', 'string', 'max:10'],
            'description.hy'      => ['sometimes', 'nullable', 'string'],
            'description.en'      => ['sometimes', 'nullable', 'string'],
        ]);

        $store = $this->stores->create($data);

        return $this->success(new StoreResource($store->load('owner')), 'Store created.', 201);
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
