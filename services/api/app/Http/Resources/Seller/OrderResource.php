<?php

namespace App\Http\Resources\Seller;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'uuid'           => $this->uuid,
            'order_number'   => $this->order_number,
            'status'         => $this->status->value,
            'payment_status' => $this->payment_status->value,
            'payment_method' => $this->payment_method,
            'subtotal'       => $this->subtotal,
            'discount'       => $this->discount,
            'shipping_cost'  => $this->shipping_cost,
            'tax'            => $this->tax,
            'total'          => $this->total,
            'currency'       => $this->currency,
            'customer_name'  => $this->customer_name,
            'customer_email' => $this->customer_email,
            'customer_phone' => $this->customer_phone,
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}
