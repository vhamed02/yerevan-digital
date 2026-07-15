<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreShippingZoneRequest;
use App\Http\Resources\Seller\ShippingZoneResource;
use App\Models\ShippingZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShippingZoneController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (! $store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $zones = ShippingZone::byStore($store->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return $this->success(ShippingZoneResource::collection($zones)->resolve());
    }

    public function store(StoreShippingZoneRequest $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (! $store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $zone = DB::transaction(function () use ($request, $store) {
            $zone = ShippingZone::create([
                ...$request->validated(),
                'store_id' => $store->id,
            ]);

            $this->enforceSingleDefault($zone);

            return $zone;
        });

        return $this->success(new ShippingZoneResource($zone->fresh()), 'Shipping zone created.', 201);
    }

    public function update(StoreShippingZoneRequest $request, string $uuid): JsonResponse
    {
        $zone = $this->findOrFail($request, $uuid);

        DB::transaction(function () use ($request, $zone) {
            $zone->update($request->validated());
            $this->enforceSingleDefault($zone);
        });

        return $this->success(new ShippingZoneResource($zone->fresh()), 'Shipping zone updated.');
    }

    public function destroy(Request $request, string $uuid): JsonResponse
    {
        $this->findOrFail($request, $uuid)->delete();

        return $this->success(null, 'Shipping zone deleted.');
    }

    /**
     * A store has at most one fallback zone — promoting one demotes the rest,
     * otherwise resolveZone() would pick between them arbitrarily.
     */
    private function enforceSingleDefault(ShippingZone $zone): void
    {
        if (! $zone->is_default) {
            return;
        }

        ShippingZone::byStore($zone->store_id)
            ->whereKeyNot($zone->id)
            ->where('is_default', true)
            ->update(['is_default' => false]);
    }

    private function findOrFail(Request $request, string $uuid): ShippingZone
    {
        $store = $request->attributes->get('sellerStore');

        abort_if(! $store, 404, 'You have not created a store yet.');

        return ShippingZone::byStore($store->id)->where('uuid', $uuid)->firstOrFail();
    }
}
