<?php

namespace App\Http\Resources\Seller;

use App\Http\Resources\Concerns\ResolvesImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductImageResource extends JsonResource
{
    use ResolvesImageUrl;

    public function toArray(Request $request): array
    {
        return [
            'uuid'      => (string) $this->id,
            'original'  => $this->imageUrl($this->path_original),
            'thumbnail' => $this->imageUrl($this->path_thumbnail),
            'medium'    => $this->imageUrl($this->path_medium),
            'large'     => $this->imageUrl($this->path_large),
            'alt'       => $this->alt,
            'sort_order' => $this->sort_order,
            'is_primary' => $this->is_primary,
        ];
    }
}
