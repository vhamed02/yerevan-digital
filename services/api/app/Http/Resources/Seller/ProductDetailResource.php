<?php

namespace App\Http\Resources\Seller;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'uuid'              => $this->uuid,
            'name'              => $this->getTranslations('name'),
            'slug'              => $this->slug,
            'description'       => $this->getTranslations('description'),
            'short_description' => $this->getTranslations('short_description'),
            'price'             => $this->price,
            'compare_price'     => $this->compare_price,
            'cost_price'        => $this->cost_price,
            'sku'               => $this->sku,
            'stock'             => $this->stock,
            'manage_stock'      => $this->manage_stock,
            'allow_backorders'  => $this->allow_backorders,
            'weight'            => $this->weight,
            'status'            => $this->status->value,
            'is_featured'       => $this->is_featured,
            'sort_order'        => $this->sort_order,
            'stock_status'      => $this->stock > 0 ? 'in_stock' : 'out_of_stock',
            'meta_title'        => $this->getTranslations('meta_title'),
            'meta_description'  => $this->getTranslations('meta_description'),
            'view_count'        => (int) ($this->view_count ?? 0),
            'created_at'        => $this->created_at?->toIso8601String(),
            'updated_at'        => $this->updated_at?->toIso8601String(),
            'images'            => ProductImageResource::collection($this->whenLoaded('images')),
            'variants'          => ProductVariantResource::collection($this->whenLoaded('variants')),
            'category'          => $this->whenLoaded('category', fn() => $this->category ? [
                'id'   => $this->category->id,
                'name' => $this->category->getTranslations('name'),
            ] : null),
        ];
    }
}
