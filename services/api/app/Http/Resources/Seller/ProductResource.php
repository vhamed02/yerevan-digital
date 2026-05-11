<?php

namespace App\Http\Resources\Seller;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $primaryImage = $this->whenLoaded('images', fn() =>
            $this->images->firstWhere('is_primary', true) ?? $this->images->first()
        );

        return [
            'id'           => $this->id,
            'uuid'         => $this->uuid,
            'name'         => $this->getTranslations('name'),
            'slug'         => $this->slug,
            'price'        => $this->price,
            'compare_price'=> $this->compare_price,
            'sku'          => $this->sku,
            'stock'        => $this->stock,
            'status'       => $this->status->value,
            'is_featured'  => $this->is_featured,
            'sort_order'   => $this->sort_order,
            'stock_status' => $this->stock > 0 ? 'in_stock' : 'out_of_stock',
            'created_at'   => $this->created_at?->toIso8601String(),
            'primary_image'=> $primaryImage ? new ProductImageResource($primaryImage) : null,
            'category'     => $this->whenLoaded('category', fn() => $this->category ? [
                'id'   => $this->category->id,
                'name' => $this->category->getTranslations('name'),
            ] : null),
        ];
    }
}
