<?php

namespace App\Http\Resources\Seller;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'key'           => $this->key,
            'name'          => $this->getTranslations('name'),
            'description'   => $this->getTranslations('description'),
            'preview_image' => $this->preview_image,
            'sort_order'    => $this->sort_order,
        ];
    }
}
