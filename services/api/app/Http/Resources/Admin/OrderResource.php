<?php

namespace App\Http\Resources\Admin;

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
            'total'          => $this->total,
            'currency'       => $this->currency,
            'customer_name'  => $this->customer_name,
            'customer_email' => $this->customer_email,
            'created_at'     => $this->created_at?->toIso8601String(),
            'store'          => $this->whenLoaded('store', fn() => [
                'id'   => $this->store->id,
                'slug' => $this->store->slug,
                'name' => $this->store->getTranslations('name'),
            ]),
        ];
    }
}
