<?php

namespace App\Http\Resources\Seller;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                        => $this->id,
            'uuid'                      => $this->uuid,
            'order_number'              => $this->order_number,
            'status'                    => $this->status->value,
            'payment_status'            => $this->payment_status->value,
            'payment_method'            => $this->payment_method,
            'payment_gateway_response'  => $this->payment_gateway_response,
            'subtotal'                  => $this->subtotal,
            'discount'                  => $this->discount,
            'shipping_cost'             => $this->shipping_cost,
            'tax'                       => $this->tax,
            'total'                     => $this->total,
            'currency'                  => $this->currency,
            'customer_name'             => $this->customer_name,
            'customer_email'            => $this->customer_email,
            'customer_phone'            => $this->customer_phone,
            'shipping_address'          => $this->shipping_address,
            'notes'                     => $this->notes,
            'paid_at'                   => $this->paid_at?->toIso8601String(),
            'shipped_at'                => $this->shipped_at?->toIso8601String(),
            'delivered_at'              => $this->delivered_at?->toIso8601String(),
            'created_at'                => $this->created_at?->toIso8601String(),
            'items'                     => OrderItemResource::collection($this->whenLoaded('items')),
            'transactions'              => $this->whenLoaded('transactions', fn() =>
                $this->transactions->map(fn($t) => [
                    'id'                      => $t->id,
                    'uuid'                    => $t->uuid,
                    'external_transaction_id' => $t->external_transaction_id,
                    'amount'                  => $t->amount,
                    'status'                  => $t->status->value,
                    'initiated_at'            => $t->initiated_at?->toIso8601String(),
                    'completed_at'            => $t->completed_at?->toIso8601String(),
                ])
            ),
        ];
    }
}
