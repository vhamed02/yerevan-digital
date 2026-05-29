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
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateOrderAction
{
    public function __construct(
        private readonly ProductRepositoryInterface        $products,
        private readonly ProductVariantRepositoryInterface $variants,
        private readonly OrderRepositoryInterface          $orders,
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

            $order = $this->orders->create([
                'store_id'         => $data->storeId,
                'status'           => OrderStatus::Pending,
                'payment_status'   => PaymentStatus::Pending,
                'subtotal'         => $subtotal,
                'discount'         => 0,
                'shipping_cost'    => 0,
                'tax'              => 0,
                'total'            => $subtotal,
                'currency'         => 'AMD',
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

            return $order;
        });

        event(new OrderCreated($order));

        return $order;
    }

}
