<?php

namespace App\Http\Resources\Store;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShippingZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid'      => $this->uuid,
            'name'      => $this->getTranslations('name'),
            'cities'    => $this->cities,
            'rate'      => $this->rate,
            'free_over' => $this->free_over,
        ];
    }
}
