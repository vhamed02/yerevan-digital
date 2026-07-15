<?php

namespace App\Http\Resources\Seller;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid'                => $this->uuid,
            'code'                => $this->code,
            'type'                => $this->type->value,
            'value'               => $this->value,
            'min_order_amount'    => $this->min_order_amount,
            'max_discount_amount' => $this->max_discount_amount,
            'usage_limit'         => $this->usage_limit,
            'used_count'          => $this->used_count,
            'starts_at'           => $this->starts_at?->toIso8601String(),
            'ends_at'             => $this->ends_at?->toIso8601String(),
            'is_active'           => $this->is_active,
            'is_expired'          => $this->hasExpired(),
            'is_exhausted'        => $this->isExhausted(),
            'created_at'          => $this->created_at?->toIso8601String(),
        ];
    }
}
