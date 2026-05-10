<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'slug'                => $this->slug,
            'name'                => $this->getTranslations('name'),
            'description'         => $this->getTranslations('description'),
            'logo'                => $this->logo,
            'banner'              => $this->banner,
            'primary_color'       => $this->primary_color,
            'active_template_key' => $this->active_template_key,
            'status'              => $this->status->value,
            'is_featured'         => $this->is_featured,
            'currency'            => $this->currency,
            'address'             => $this->address,
            'phone'               => $this->phone,
            'email'               => $this->email,
            'social_links'        => $this->social_links,
            'custom_domain'       => $this->custom_domain,
            'products_count'      => $this->products_count ?? 0,
            'orders_count'        => $this->orders_count ?? 0,
            'revenue'             => $this->orders_sum_total ?? 0,
            'created_at'          => $this->created_at?->toIso8601String(),
            'owner'               => $this->whenLoaded('owner', fn() => [
                'id'    => $this->owner->id,
                'name'  => $this->owner->name,
                'email' => $this->owner->email,
                'phone' => $this->owner->phone,
            ]),
            'payment_gateways'    => $this->whenLoaded('paymentGateways', fn() =>
                $this->paymentGateways->map(fn($pg) => [
                    'id'         => $pg->id,
                    'name'       => $pg->gateway?->name,
                    'is_enabled' => $pg->is_enabled,
                    'is_sandbox' => $pg->is_sandbox,
                ])
            ),
        ];
    }
}
