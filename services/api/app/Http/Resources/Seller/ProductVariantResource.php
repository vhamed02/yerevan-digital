<?php

namespace App\Http\Resources\Seller;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->getTranslations('name'),
            'sku'        => $this->sku,
            'price'      => $this->price,
            'stock'      => $this->stock,
            'attributes' => $this->attributes,
            'image'      => $this->image,
            'is_active'  => $this->is_active,
        ];
    }
}
