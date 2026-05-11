<?php

namespace App\Http\Resources\Seller;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConfiguredGatewayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'is_enabled'   => $this->is_enabled,
            'is_sandbox'   => $this->is_sandbox,
            'gateway'      => $this->whenLoaded('gateway', fn() => [
                'id'           => $this->gateway->id,
                'name'         => $this->gateway->name,
                'display_name' => $this->gateway->getTranslations('display_name'),
                'logo'         => $this->gateway->logo,
            ]),
        ];
    }
}
