<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'uuid'                => $this->uuid,
            'number'              => 'INV-' . strtoupper(substr($this->uuid, 0, 8)),
            'status'              => $this->status->value,
            'amount'              => $this->amount,
            'currency'            => $this->currency,
            'period_start'        => $this->period_start->toDateString(),
            'period_end'          => $this->period_end->toDateString(),
            'paid_at'             => $this->paid_at?->toIso8601String(),
            'payment_reference'   => $this->payment_reference,
            'created_at'          => $this->created_at?->toIso8601String(),
            'store'               => $this->whenLoaded('store', fn () => [
                'id'   => $this->store->id,
                'name' => $this->store->getTranslations('name'),
                'slug' => $this->store->slug,
            ]),
        ];
    }
}
