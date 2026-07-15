<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Resources\Store\ShippingZoneResource;
use App\Models\ShippingZone;
use App\Services\ShippingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingController extends Controller
{
    public function __construct(private readonly ShippingService $shipping) {}

    /** Zones a shopper can see, so the storefront can show delivery options. */
    public function zones(Request $request, string $slug): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $zones = ShippingZone::byStore($store->id)
            ->active()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return $this->success(ShippingZoneResource::collection($zones)->resolve());
    }

    /** What shipping will cost for a given city and cart subtotal. */
    public function quote(Request $request, string $slug): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $validated = $request->validate([
            'city'     => ['nullable', 'string', 'max:100'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $quote = $this->shipping->quote(
            $store->id,
            $validated['city'] ?? null,
            (string) $validated['subtotal'],
        );

        return $this->success([
            'cost'        => $quote['cost'],
            'free_reason' => $quote['free_reason'],
            'zone'        => $quote['zone']
                ? (new ShippingZoneResource($quote['zone']))->resolve()
                : null,
        ]);
    }
}
