<?php

namespace App\Http\Resources\Store;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid'           => $this->uuid,
            'order_number'   => $this->order_number,
            'status'         => $this->status->value,
            'total'          => (float) $this->total,
            'customer_name'  => $this->customer_name,
            'customer_email' => $this->customer_email,
            'created_at'     => $this->created_at?->toIso8601String(),
            'items'          => $this->whenLoaded('items', fn() =>
                $this->items->map(fn($item) => [
                    'product_name' => $item->product_name ?? [],
                    'variant_name' => $item->variant_name ? implode(', ', (array) $item->variant_name) : null,
                    'quantity'     => $item->quantity,
                    'price'        => (float) $item->unit_price,
                ])
            ),
        ];
    }
}
