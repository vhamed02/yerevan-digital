<?php

namespace App\Actions;

use App\Data\CheckoutData;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\OrderCreated;
use App\Models\Order;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\ProductVariantRepositoryInterface;
use App\Services\CouponService;
use App\Services\ShippingService;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateOrderAction
{
    public function __construct(
        private readonly ProductRepositoryInterface        $products,
        private readonly ProductVariantRepositoryInterface $variants,
        private readonly OrderRepositoryInterface          $orders,
        private readonly CouponService                     $coupons,
        private readonly ShippingService                   $shipping,
    ) {}

    public function execute(CheckoutData $data): Order
    {
        $order = DB::transaction(function () use ($data) {
            $subtotal      = 0;
            $resolvedItems = [];

            foreach ($data->items as $index => $item) {
                $product = $this->products->findActiveByStoreAndUuid($data->storeId, $item['product_id'], true);

                $variant = null;
                if (!empty($item['variant_id'])) {
                    $variant = $this->variants->findActiveByProductLocked($product->id, $item['variant_id']);
                }

                $price          = $variant ? (float) $variant->price : (float) $product->price;
                $stock          = $variant ? $variant->stock : $product->stock;
                $qty            = (int) $item['quantity'];

                if ($product->manage_stock && !$product->allow_backorders && $stock < $qty) {
                    $locale = app()->getLocale() === 'hy' ? 'hy' : 'en';
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => "Insufficient stock for: {$product->getTranslation('name', $locale)}",
                    ]);
                }

                $subtotal += $price * $qty;

                $resolvedItems[] = [
                    'product'  => $product,
                    'variant'  => $variant,
                    'price'    => $price,
                    'quantity' => $qty,
                ];
            }

            // Hand off to exact decimal maths for everything downstream of the
            // item loop, so discount/shipping/total never drift on a float.
            $subtotalAmount = Money::of(number_format($subtotal, 2, '.', ''));

            [$coupon, $discount] = $this->resolveCoupon($data, $subtotalAmount);

            $shippingCost = $this->shipping->quote(
                $data->storeId,
                $data->shippingAddress['city'] ?? null,
                $subtotalAmount,
            )['cost'];

            $total = Money::add(Money::sub($subtotalAmount, $discount), $shippingCost);

            $order = $this->orders->create([
                'store_id'         => $data->storeId,
                'customer_id'      => $data->customerId,
                'coupon_id'        => $coupon?->id,
                'coupon_code'      => $coupon?->code,
                'status'           => OrderStatus::Pending,
                'payment_status'   => PaymentStatus::Pending,
                'subtotal'         => $subtotalAmount,
                'discount'         => $discount,
                'shipping_cost'    => $shippingCost,
                'tax'              => 0,
                'total'            => $total,
                'currency'         => 'AMD',
                'locale'           => in_array(app()->getLocale(), config('app.supported_locales'), true)
                    ? app()->getLocale()
                    : config('app.locale'),
                'customer_name'    => $data->customerName,
                'customer_email'   => $data->customerEmail,
                'customer_phone'   => $data->customerPhone,
                'shipping_address' => $data->shippingAddress,
                'notes'            => $data->notes,
                'payment_method'   => $data->paymentMethod,
            ]);

            foreach ($resolvedItems as $resolved) {
                $product = $resolved['product'];
                $variant = $resolved['variant'];
                $qty     = $resolved['quantity'];
                $price   = $resolved['price'];

                $order->items()->create([
                    'product_id'   => $product->id,
                    'variant_id'   => $variant?->id,
                    'product_name' => $product->getTranslations('name'),
                    'variant_name' => $variant ? $variant->attributes : null,
                    'sku'          => $variant?->sku ?? $product->sku,
                    'quantity'     => $qty,
                    'unit_price'   => $price,
                    'total_price'  => $price * $qty,
                ]);

                if ($product->manage_stock) {
                    if ($variant) {
                        $this->variants->decrement($variant->id, $qty);
                    } else {
                        $product->decrement('stock', $qty);
                    }
                }
            }

            // Safe against the usage limit: the row stays locked for the rest of
            // this transaction, so concurrent checkouts queue behind it.
            $coupon?->increment('used_count');

            return $order;
        });

        event(new OrderCreated($order));

        return $order;
    }

    /**
     * @return array{0: \App\Models\Coupon|null, 1: string}
     */
    private function resolveCoupon(CheckoutData $data, string $subtotal): array
    {
        if ($data->couponCode === null || trim($data->couponCode) === '') {
            return [null, Money::ZERO];
        }

        $coupon = $this->coupons->findByCodeForUpdate($data->storeId, $data->couponCode);

        if (! $coupon) {
            throw ValidationException::withMessages([
                'coupon_code' => 'This coupon code is not valid.',
            ]);
        }

        if ($reason = $this->coupons->reasonUnusable($coupon, $subtotal)) {
            throw ValidationException::withMessages(['coupon_code' => $reason]);
        }

        return [$coupon, $this->coupons->discountFor($coupon, $subtotal)];
    }
}
