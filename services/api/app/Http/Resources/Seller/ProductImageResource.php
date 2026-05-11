<?php

namespace App\Http\Resources\Seller;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'path_original'  => $this->path_original,
            'path_thumbnail' => $this->path_thumbnail,
            'path_medium'    => $this->path_medium,
            'path_large'     => $this->path_large,
            'alt'            => $this->alt,
            'sort_order'     => $this->sort_order,
            'is_primary'     => $this->is_primary,
        ];
    }
}
