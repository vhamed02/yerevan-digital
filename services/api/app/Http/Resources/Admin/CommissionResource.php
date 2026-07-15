<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'uuid'        => $this->uuid,
            'type'        => $this->type->value,
            'rate'        => $this->rate,
            'base_amount' => $this->base_amount,
            'amount'      => $this->amount,
            'currency'    => $this->currency,
            'reason'      => $this->reason,
            'created_at'  => $this->created_at?->toIso8601String(),
            'store'       => $this->whenLoaded('store', fn () => [
                'id'   => $this->store->id,
                'name' => $this->store->name,
                'slug' => $this->store->slug,
            ]),
            'order'       => $this->whenLoaded('order', fn () => [
                'uuid'         => $this->order->uuid,
                'order_number' => $this->order->order_number,
                'total'        => $this->order->total,
            ]),
        ];
    }
}
