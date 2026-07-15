<?php

namespace App\Services;

use App\Enums\CommissionType;
use App\Models\Commission;
use App\Models\Order;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Support\Money;

/**
 * Records platform commission against orders.
 *
 * All arithmetic goes through {@see Money} — decimal strings via bcmath, never
 * floats, rounded half-up.
 *
 * Callers are responsible for wrapping accrue()/reverse() in the same database
 * transaction as the order state change they accompany.
 */
class CommissionService
{
    /**
     * Write the commission owed on a paid order. Idempotent per order.
     */
    public function accrue(Order $order, ?string $reason = null): Commission
    {
        $rate = $this->rateFor($order->store_id);
        $base = $this->baseFor($order);

        return Commission::firstOrCreate(
            ['order_id' => $order->id, 'type' => CommissionType::Accrual],
            [
                'store_id'    => $order->store_id,
                'rate'        => $rate,
                'base_amount' => $base,
                'amount'      => $this->calculate($base, $rate),
                'currency'    => $order->currency,
                'reason'      => $reason,
            ],
        );
    }

    /**
     * Undo an accrued commission by writing an equal, opposite row. Idempotent
     * per order; a no-op when the order never accrued commission (e.g. it was
     * cancelled before payment).
     */
    public function reverse(Order $order, string $reason): ?Commission
    {
        $accrual = Commission::where('order_id', $order->id)
            ->where('type', CommissionType::Accrual)
            ->first();

        if (! $accrual) {
            return null;
        }

        return Commission::firstOrCreate(
            ['order_id' => $order->id, 'type' => CommissionType::Reversal],
            [
                'store_id'    => $accrual->store_id,
                // Mirror the original rate/base so the pair reconciles exactly.
                'rate'        => $accrual->rate,
                'base_amount' => $accrual->base_amount,
                'amount'      => Money::negate((string) $accrual->amount),
                'currency'    => $accrual->currency,
                'reason'      => $reason,
            ],
        );
    }

    /**
     * Effective rate for a store: its own override, else the platform setting,
     * else the configured default.
     */
    public function rateFor(int $storeId): string
    {
        $storeRate = Store::whereKey($storeId)->value('commission_rate');

        if ($this->isValidRate($storeRate)) {
            return (string) $storeRate;
        }

        return $this->platformDefaultRate();
    }

    public function platformDefaultRate(): string
    {
        $setting = StoreSetting::platform()->where('key', 'commission_rate')->value('value');

        return $this->isValidRate($setting)
            ? (string) $setting
            : (string) config('commission.default_rate');
    }

    /**
     * Commission is charged on net merchandise value. Shipping and tax are
     * pass-through costs and are deliberately excluded from the base.
     */
    public function baseFor(Order $order): string
    {
        return Money::atLeastZero(
            Money::sub(Money::of($order->subtotal), Money::of($order->discount))
        );
    }

    public function calculate(string $base, string $rate): string
    {
        return Money::mul($base, $rate);
    }

    /**
     * A rate is a fraction between 0 and 1 inclusive. Anything else (negative,
     * >100%, non-numeric leftovers in settings) is ignored rather than trusted.
     */
    private function isValidRate(mixed $rate): bool
    {
        return $rate !== null
            && is_numeric($rate)
            && bccomp((string) $rate, '0', 4) >= 0
            && bccomp((string) $rate, '1', 4) <= 0;
    }
}
