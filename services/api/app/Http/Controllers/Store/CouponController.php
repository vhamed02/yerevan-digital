<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Services\CouponService;
use App\Support\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function __construct(private readonly CouponService $coupons) {}

    /**
     * Cart-side preview of what a code is worth. Advisory only — checkout
     * re-resolves the coupon against a server-computed subtotal, so a tampered
     * subtotal here buys nothing but a wrong number on the shopper's screen.
     */
    public function preview(Request $request, string $slug): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $validated = $request->validate([
            'code'     => ['required', 'string', 'max:50'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $coupon = $this->coupons->findByCode($store->id, $validated['code']);

        if (! $coupon) {
            return $this->error('This coupon code is not valid.', 422);
        }

        $subtotal = Money::of($validated['subtotal']);

        if ($reason = $this->coupons->reasonUnusable($coupon, $subtotal)) {
            return $this->error($reason, 422);
        }

        $discount = $this->coupons->discountFor($coupon, $subtotal);

        return $this->success([
            'code'     => $coupon->code,
            'type'     => $coupon->type->value,
            'value'    => $coupon->value,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total'    => Money::sub($subtotal, $discount),
        ]);
    }
}
