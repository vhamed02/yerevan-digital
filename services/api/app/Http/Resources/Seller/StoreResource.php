<?php

namespace App\Http\Resources\Seller;

use App\Http\Resources\Concerns\ResolvesImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreResource extends JsonResource
{
    use ResolvesImageUrl;

    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'uuid'                => $this->uuid,
            'slug'                => $this->slug,
            'name'                => $this->getTranslations('name'),
            'description'         => $this->getTranslations('description'),
            'logo_url'            => $this->imageUrl($this->logo),
            'banner_url'          => $this->imageUrl($this->banner),
            'favicon_url'         => $this->imageUrl($this->favicon),
            'primary_color'       => $this->primary_color,
            'active_template_key' => $this->active_template_key,
            'status'              => $this->status->value,
            'currency'            => $this->currency,
            'address'             => $this->address,
            'phone'               => $this->phone,
            'email'               => $this->email,
            'social_links'        => $this->social_links,
            'custom_domain'       => $this->custom_domain,
            'meta_title'          => $this->getTranslations('meta_title'),
            'meta_description'    => $this->getTranslations('meta_description'),
            'is_featured'         => $this->is_featured,
            'created_at'          => $this->created_at?->toIso8601String(),
        ];
    }
}
