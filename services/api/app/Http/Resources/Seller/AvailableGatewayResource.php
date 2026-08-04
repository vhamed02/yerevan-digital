<?php

namespace App\Http\Resources\Seller;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvailableGatewayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'name'                 => $this->name,
            'display_name'         => $this->getTranslations('display_name'),
            'description'          => $this->getTranslations('description'),
            'logo'                 => $this->logo,
            'is_sandbox_available' => $this->is_sandbox_available,
            'required_fields'      => $this->required_fields,
            'instructions'         => $this->getTranslations('instructions'),
            'is_configured'        => (bool) ($this->storeGateway ?? false),
            'is_enabled'           => $this->storeGateway?->is_enabled ?? false,
            // Reflected back so the config form doesn't silently reset a live
            // gateway to sandbox (or vice versa) on an unrelated edit.
            'is_sandbox'           => $this->storeGateway?->is_sandbox ?? false,
            // Gateways whose callback/return addresses are registered with the
            // provider by the seller rather than sent per payment (Idram) need
            // to show those exact addresses for copying.
            'integration_urls'     => $this->integrationUrls ?? null,
        ];
    }
}
