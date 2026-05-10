<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'parent_id'  => $this->parent_id,
            'name'       => $this->getTranslations('name'),
            'slug'       => $this->slug,
            'icon'       => $this->icon,
            'image'      => $this->image,
            'sort_order' => $this->sort_order,
            'is_active'  => $this->is_active,
            'children'   => CategoryResource::collection($this->whenLoaded('children')),
        ];
    }
}
