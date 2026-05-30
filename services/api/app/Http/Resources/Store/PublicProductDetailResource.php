<?php

namespace App\Http\Resources\Store;

use App\Http\Resources\Concerns\ResolvesImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicProductDetailResource extends JsonResource
{
    use ResolvesImageUrl;

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
                    'thumbnail' => $this->imageUrl($img->path_thumbnail),
                    'medium'    => $this->imageUrl($img->path_medium),
                    'large'     => $this->imageUrl($img->path_large),
                    'original'  => $this->imageUrl($img->path_original),
                ])->values()->all()
            ),
            'variants'          => $this->whenLoaded('variants', fn() =>
                $this->variants
                    ->where('is_active', true)
                    ->values()
                    ->map(fn($v) => [
                        'id'         => $v->id,
                        'attributes' => $v->attributes ?? [],
                        'price'      => (float) $v->price,
                        'stock'      => $v->stock,
                        'sku'        => $v->sku,
                        'is_active'  => $v->is_active,
                    ])->all()
            ),
            'category'          => $this->whenLoaded('category', fn() => $this->category ? [
                'id'   => $this->category->id,
                'name' => $this->category->getTranslations('name'),
                'slug' => $this->category->slug,
            ] : null),
            'view_count'        => (int) ($this->view_count ?? 0),
            // Read from the loadAvg/loadCount aggregates (all approved reviews),
            // not from the display collection which is capped at 50.
            'rating_avg'        => $this->whenLoaded('reviews', fn() =>
                $this->rating_avg !== null ? round((float) $this->rating_avg, 1) : null
            ),
            'rating_count'      => $this->whenLoaded('reviews', fn() => (int) ($this->rating_count ?? 0)),
            'reviews'           => $this->whenLoaded('reviews', fn() =>
                $this->reviews->map(fn($r) => [
                    'id'            => $r->id,
                    'reviewer_name' => $r->reviewer_name,
                    'rating'        => $r->rating,
                    'body'          => $r->body,
                    'created_at'    => $r->created_at->toDateString(),
                ])->values()->all()
            ),
        ];
    }
}
