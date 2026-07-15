<?php

namespace App\Services;

use App\Models\ShippingZone;
use App\Support\Money;

/**
 * Works out shipping cost for an order.
 *
 * Resolution order: the first active zone that lists the destination city, then
 * the store's default zone, then free. A store with no zones configured ships
 * everything for free, which is how every store behaves before a seller sets
 * any up — so adding this feature never silently starts charging shipping.
 */
class ShippingService
{
    /**
     * @return array{zone: ShippingZone|null, cost: string, free_reason: string|null}
     */
    public function quote(int $storeId, ?string $city, string $subtotal): array
    {
        $zone = $this->resolveZone($storeId, $city);

        if (! $zone) {
            return ['zone' => null, 'cost' => Money::ZERO, 'free_reason' => 'no_zones'];
        }

        $subtotal = Money::atLeastZero(Money::of($subtotal));

        if ($zone->free_over !== null
            && Money::compare($subtotal, Money::of($zone->free_over)) >= 0) {
            return ['zone' => $zone, 'cost' => Money::ZERO, 'free_reason' => 'free_over'];
        }

        return ['zone' => $zone, 'cost' => Money::of($zone->rate), 'free_reason' => null];
    }

    public function resolveZone(int $storeId, ?string $city): ?ShippingZone
    {
        $zones = ShippingZone::byStore($storeId)
            ->active()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        foreach ($zones as $zone) {
            if ($zone->covers($city)) {
                return $zone;
            }
        }

        return $zones->firstWhere('is_default', true);
    }
}
