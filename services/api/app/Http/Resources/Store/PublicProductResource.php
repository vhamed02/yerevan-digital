<?php

namespace App\Http\Resources\Store;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $primaryImage = $this->whenLoaded('images', fn() =>
            $this->images->firstWhere('is_primary', true) ?? $this->images->first()
        );

        return [
            'uuid'          => $this->uuid,
            'name'          => $this->getTranslations('name'),
            'slug'          => $this->slug,
            'description_short' => $this->getTranslations('short_description'),
            'price'         => (float) $this->price,
            'compare_price' => $this->compare_price ? (float) $this->compare_price : null,
            'is_featured'   => $this->is_featured,
            'stock'         => $this->stock,
            'manage_stock'  => $this->manage_stock,
            'stock_status'  => (!$this->manage_stock || $this->stock > 0) ? 'in_stock' : 'out_of_stock',
            'images'        => $this->whenLoaded('images', fn() =>
                $this->images->map(fn($img) => [
                    'uuid'      => (string) $img->id,
                    'thumbnail' => $img->path_thumbnail ? asset("storage/{$img->path_thumbnail}") : null,
                    'medium'    => $img->path_medium ? asset("storage/{$img->path_medium}") : null,
                    'large'     => $img->path_large ? asset("storage/{$img->path_large}") : null,
                    'original'  => $img->path_original ? asset("storage/{$img->path_original}") : null,
                ])
            ),
            'category'      => $this->whenLoaded('category', fn() => $this->category ? [
                'id'   => $this->category->id,
                'name' => $this->category->getTranslations('name'),
                'slug' => $this->category->slug,
            ] : null),
        ];
    }
}
