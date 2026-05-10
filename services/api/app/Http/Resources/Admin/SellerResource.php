<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SellerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'phone'      => $this->phone,
            'status'     => $this->status->value,
            'locale'     => $this->locale,
            'created_at' => $this->created_at?->toIso8601String(),
            'store'      => $this->whenLoaded('store', fn() => [
                'id'           => $this->store->id,
                'slug'         => $this->store->slug,
                'name'         => $this->store->getTranslations('name'),
                'status'       => $this->store->status->value,
                'orders_count' => $this->store->orders_count ?? 0,
                'revenue'      => $this->store->orders_sum_total ?? 0,
            ]),
        ];
    }
}
