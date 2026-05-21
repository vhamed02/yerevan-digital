<?php

namespace App\Http\Resources\Store;

use App\Http\Resources\Concerns\ResolvesImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicProductResource extends JsonResource
{
    use ResolvesImageUrl;

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
                    'thumbnail' => $this->imageUrl($img->path_thumbnail),
                    'medium'    => $this->imageUrl($img->path_medium),
                    'large'     => $this->imageUrl($img->path_large),
                    'original'  => $this->imageUrl($img->path_original),
                ])->values()->all()
            ),
            'view_count'    => (int) ($this->view_count ?? 0),
            'category'      => $this->whenLoaded('category', fn() => $this->category ? [
                'id'   => $this->category->id,
                'name' => $this->category->getTranslations('name'),
                'slug' => $this->category->slug,
            ] : null),
        ];
    }
}
