<?php

namespace App\Http\Controllers\Store;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\ProductVariantRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly ProductRepositoryInterface        $products,
        private readonly ProductVariantRepositoryInterface $variants,
        private readonly OrderRepositoryInterface          $orders,
    ) {}

    public function checkout(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'items'              => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.quantity'   => ['required', 'integer', 'min:1', 'max:100'],
            'full_name'          => ['required', 'string', 'max:255'],
            'email'              => ['required', 'email'],
            'phone'              => ['nullable', 'string', 'max:30'],
            'address'            => ['required', 'string', 'max:500'],
            'city'               => ['required', 'string', 'max:100'],
            'postal_code'        => ['nullable', 'string', 'max:20'],
            'country'            => ['required', 'string', 'max:100'],
            'notes'              => ['nullable', 'string', 'max:500'],
            'payment_method'     => ['required', 'string'],
        ]);

        $store = $request->attributes->get('currentStore');
        $items = $request->input('items');

        $order = DB::transaction(function () use ($request, $store, $items) {
            $subtotal      = 0;
            $resolvedItems = [];

            foreach ($items as $index => $item) {
                $product = $this->products->findActiveByStoreAndUuid($store->id, $item['product_id'], true);

                $variant = null;
                if (!empty($item['variant_id'])) {
                    $variant = $this->variants->findActiveByProductLocked($product->id, $item['variant_id']);
                }

                $price          = $variant ? (float) $variant->price : (float) $product->price;
                $stock          = $variant ? $variant->stock : $product->stock;
                $managedStock   = $product->manage_stock;
                $allowBackorder = $product->allow_backorders;
                $qty            = (int) $item['quantity'];

                if ($managedStock && !$allowBackorder && $stock < $qty) {
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
                'store_id'         => $store->id,
                'status'           => OrderStatus::Pending,
                'payment_status'   => PaymentStatus::Pending,
                'subtotal'         => $subtotal,
                'discount'         => 0,
                'shipping_cost'    => 0,
                'tax'              => 0,
                'total'            => $subtotal,
                'currency'         => 'AMD',
                'customer_name'    => $request->input('full_name'),
                'customer_email'   => $request->input('email'),
                'customer_phone'   => $request->input('phone'),
                'shipping_address' => [
                    'line1'       => $request->input('address'),
                    'city'        => $request->input('city'),
                    'postal_code' => $request->input('postal_code'),
                    'country'     => $request->input('country'),
                ],
                'notes'          => $request->input('notes'),
                'payment_method' => $request->input('payment_method'),
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

        return $this->success([
            'uuid'            => $order->uuid,
            'order_number'    => $order->order_number,
            'total'           => (float) $order->total,
            'currency'        => $order->currency,
            'payment_gateway' => $request->input('payment_method'),
        ], 'Order created.', 201);
    }
}
