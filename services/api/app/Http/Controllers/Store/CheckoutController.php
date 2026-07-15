<?php

namespace App\Http\Controllers\Store;

use App\Actions\CreateOrderAction;
use App\Data\CheckoutData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Store\CheckoutRequest;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    public function __construct(private readonly CreateOrderAction $createOrder) {}

    public function checkout(CheckoutRequest $request, string $slug): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $order = $this->createOrder->execute(new CheckoutData(
            storeId:         $store->id,
            customerId:      $request->user('sanctum')?->id,
            items:           $request->validated('items'),
            customerName:    $request->validated('full_name'),
            customerEmail:   $request->validated('email'),
            customerPhone:   $request->validated('phone'),
            shippingAddress: [
                'line1'       => $request->validated('address'),
                'city'        => $request->validated('city'),
                'postal_code' => $request->validated('postal_code'),
                'country'     => $request->validated('country'),
            ],
            notes:         $request->validated('notes'),
            paymentMethod: $request->validated('payment_method'),
            couponCode:    $request->validated('coupon_code'),
        ));

        return $this->success([
            'uuid'            => $order->uuid,
            'order_number'    => $order->order_number,
            'subtotal'        => (float) $order->subtotal,
            'discount'        => (float) $order->discount,
            'shipping_cost'   => (float) $order->shipping_cost,
            'total'           => (float) $order->total,
            'coupon_code'     => $order->coupon_code,
            'currency'        => $order->currency,
            'payment_gateway' => $order->payment_method,
        ], 'Order created.', 201);
    }
}
