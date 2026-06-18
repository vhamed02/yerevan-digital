<?php

namespace App\Http\Resources\Customer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid'             => $this->uuid,
            'order_number'     => $this->order_number,
            'status'           => $this->status->value,
            'payment_status'   => $this->payment_status->value,
            'payment_method'   => $this->payment_method,
            'subtotal'         => (float) $this->subtotal,
            'discount'         => (float) $this->discount,
            'shipping_cost'    => (float) $this->shipping_cost,
            'tax'              => (float) $this->tax,
            'total'            => (float) $this->total,
            'currency'         => $this->currency,
            'customer_name'    => $this->customer_name,
            'customer_email'   => $this->customer_email,
            'customer_phone'   => $this->customer_phone,
            'shipping_address' => $this->shipping_address,
            'notes'            => $this->notes,
            'created_at'       => $this->created_at?->toIso8601String(),
            'paid_at'          => $this->paid_at?->toIso8601String(),
            'shipped_at'       => $this->shipped_at?->toIso8601String(),
            'delivered_at'     => $this->delivered_at?->toIso8601String(),
            'store'            => $this->whenLoaded('store', fn() => [
                'slug' => $this->store->slug,
                'name' => $this->store->getTranslations('name'),
            ]),
            'items'            => $this->whenLoaded('items', fn() =>
                $this->items->map(fn($item) => [
                    'product_name' => $item->product_name ?? [],
                    'variant_name' => $item->variant_name ? implode(', ', (array) $item->variant_name) : null,
                    'sku'          => $item->sku,
                    'quantity'     => $item->quantity,
                    'unit_price'   => (float) $item->unit_price,
                    'total_price'  => (float) $item->total_price,
                ])
            ),
        ];
    }
}
