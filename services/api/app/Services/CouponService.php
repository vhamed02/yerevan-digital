<?php

namespace App\Services;

use App\Enums\CouponType;
use App\Models\Coupon;
use App\Support\Money;

/**
 * Validates coupon codes and works out what they are worth.
 *
 * A coupon only ever discounts merchandise value (the order subtotal), never
 * shipping — which also keeps the commission base honest, since commission is
 * charged on subtotal minus discount.
 */
class CouponService
{
    public function findByCode(int $storeId, string $code): ?Coupon
    {
        return Coupon::byStore($storeId)
            ->where('code', $this->normaliseCode($code))
            ->first();
    }

    /**
     * Same lookup, but locking the row for the rest of the transaction so two
     * concurrent checkouts cannot both slip past the usage limit.
     */
    public function findByCodeForUpdate(int $storeId, string $code): ?Coupon
    {
        return Coupon::byStore($storeId)
            ->where('code', $this->normaliseCode($code))
            ->lockForUpdate()
            ->first();
    }

    /**
     * Why this coupon cannot be applied to an order of $subtotal, or null when
     * it can. The message is safe to show a shopper.
     */
    public function reasonUnusable(Coupon $coupon, string $subtotal): ?string
    {
        if (! $coupon->is_active) {
            return 'This coupon is no longer active.';
        }

        if (! $coupon->hasStarted()) {
            return 'This coupon is not active yet.';
        }

        if ($coupon->hasExpired()) {
            return 'This coupon has expired.';
        }

        if ($coupon->isExhausted()) {
            return 'This coupon has reached its usage limit.';
        }

        $minimum = Money::of($coupon->min_order_amount);

        if (Money::compare(Money::of($subtotal), $minimum) < 0) {
            return "This coupon requires a minimum order of {$minimum} AMD.";
        }

        return null;
    }

    /**
     * The discount this coupon is worth against $subtotal. Never exceeds the
     * subtotal, so an order can't go negative.
     */
    public function discountFor(Coupon $coupon, string $subtotal): string
    {
        $subtotal = Money::atLeastZero(Money::of($subtotal));
        $value    = Money::of($coupon->value);

        $discount = match ($coupon->type) {
            CouponType::Fixed   => $value,
            CouponType::Percent => Money::mul($subtotal, Money::div($value, '100')),
        };

        if ($coupon->type === CouponType::Percent && $coupon->max_discount_amount !== null) {
            $discount = Money::min($discount, Money::of($coupon->max_discount_amount));
        }

        return Money::min($discount, $subtotal);
    }

    private function normaliseCode(string $code): string
    {
        return strtoupper(trim($code));
    }
}
