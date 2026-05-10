<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentGatewayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'name'                 => $this->name,
            'display_name'         => $this->getTranslations('display_name'),
            'description'          => $this->getTranslations('description'),
            'logo'                 => $this->logo,
            'is_active'            => $this->is_active,
            'is_sandbox_available' => $this->is_sandbox_available,
            'required_fields'      => $this->required_fields,
            'instructions'         => $this->getTranslations('instructions'),
            'sort_order'           => $this->sort_order,
            'active_stores_count'  => $this->store_gateways_count ?? 0,
        ];
    }
}
