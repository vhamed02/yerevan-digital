<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'slug'         => $this->slug,
            'name'         => $this->getTranslations('name'),
            'status'       => $this->status->value,
            'is_featured'  => $this->is_featured,
            'currency'     => $this->currency,
            'orders_count' => $this->orders_count ?? 0,
            'revenue'      => $this->orders_sum_total ?? 0,
            'created_at'   => $this->created_at?->toIso8601String(),
            'owner'        => $this->whenLoaded('owner', fn() => [
                'id'    => $this->owner->id,
                'name'  => $this->owner->name,
                'email' => $this->owner->email,
            ]),
        ];
    }
}
