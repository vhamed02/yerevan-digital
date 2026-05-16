<?php

namespace App\Http\Resources\Store;

use App\Models\StoreTemplateConfig;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreInfoResource extends JsonResource
{
    public function __construct($resource, private readonly ?array $templateConfig = null)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $config = $this->templateConfig ?? [];

        return [
            'id'                  => $this->id,
            'slug'                => $this->slug,
            'name'                => $this->getTranslations('name'),
            'description'         => $this->getTranslations('description'),
            'logo_url'            => $this->logo ? asset("storage/{$this->logo}") : null,
            'banner_url'          => $this->banner ? asset("storage/{$this->banner}") : null,
            'active_template_key' => $this->active_template_key ?: 'minimal',
            'template_config'     => [
                'primary_color'       => $config['primary_color'] ?? ($this->primary_color ?: '#6366f1'),
                'secondary_color'     => $config['secondary_color'] ?? '#8b5cf6',
                'font_heading'        => $config['font_heading'] ?? 'Inter',
                'font_pair'           => $config['font_pair'] ?? 'plus_jakarta_inter',
                'products_per_row'    => $config['products_per_row'] ?? 3,
                'show_hero_banner'    => $config['show_hero'] ?? true,
                'show_categories_bar' => $config['show_categories_bar'] ?? true,
            ],
            'currency'            => $this->currency ?? 'AMD',
            'phone'               => $this->phone,
            'email'               => $this->email,
            'address'             => $this->address,
            'social_instagram'    => $this->social_links['instagram'] ?? null,
            'social_facebook'     => $this->social_links['facebook'] ?? null,
            'meta_title'          => $this->getTranslations('meta_title'),
            'meta_description'    => $this->getTranslations('meta_description'),
            'payment_gateways'    => $this->whenLoaded('paymentGateways', fn() =>
                $this->paymentGateways
                    ->filter(fn($g) => $g->is_enabled)
                    ->map(fn($g) => $g->gateway?->name)
                    ->filter()
                    ->values()
                    ->all()
            ),
        ];
    }
}
