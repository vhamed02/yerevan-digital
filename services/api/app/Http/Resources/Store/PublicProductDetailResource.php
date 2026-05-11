<?php

namespace App\Http\Resources\Store;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicProductDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid'              => $this->uuid,
            'slug'              => $this->slug,
            'name'              => $this->getTranslations('name'),
            'description_short' => $this->getTranslations('short_description'),
            'description_full'  => $this->getTranslations('description'),
            'price'             => (float) $this->price,
            'compare_price'     => $this->compare_price ? (float) $this->compare_price : null,
            'is_featured'       => $this->is_featured,
            'stock'             => $this->stock,
            'manage_stock'      => $this->manage_stock,
            'stock_status'      => (!$this->manage_stock || $this->stock > 0) ? 'in_stock' : 'out_of_stock',
            'meta_title'        => $this->getTranslations('meta_title'),
            'meta_description'  => $this->getTranslations('meta_description'),
            'images'            => $this->whenLoaded('images', fn() =>
                $this->images->map(fn($img) => [
                    'uuid'      => (string) $img->id,
                    'thumbnail' => $img->path_thumbnail ? asset("storage/{$img->path_thumbnail}") : null,
                    'medium'    => $img->path_medium ? asset("storage/{$img->path_medium}") : null,
                    'large'     => $img->path_large ? asset("storage/{$img->path_large}") : null,
                    'original'  => $img->path_original ? asset("storage/{$img->path_original}") : null,
                ])
            ),
            'variants'          => $this->whenLoaded('variants', fn() =>
                $this->variants
                    ->where('is_active', true)
                    ->values()
                    ->map(fn($v) => [
                        'id'         => $v->id,
                        'attributes' => $v->attributes,
                        'price'      => (float) $v->price,
                        'stock'      => $v->stock,
                        'sku'        => $v->sku,
                        'is_active'  => $v->is_active,
                    ])
            ),
            'category'          => $this->whenLoaded('category', fn() => $this->category ? [
                'id'   => $this->category->id,
                'name' => $this->category->getTranslations('name'),
                'slug' => $this->category->slug,
            ] : null),
        ];
    }
}
