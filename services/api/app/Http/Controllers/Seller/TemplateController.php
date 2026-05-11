<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\UpdateTemplateActiveRequest;
use App\Http\Requests\Seller\UpdateTemplateConfigRequest;
use App\Http\Resources\Seller\TemplateResource;
use App\Models\StoreTemplate;
use App\Models\StoreTemplateConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TemplateController extends Controller
{
    public function available(): JsonResponse
    {
        $templates = StoreTemplate::active()->orderBy('sort_order')->get();

        return $this->success(TemplateResource::collection($templates));
    }

    public function updateActive(UpdateTemplateActiveRequest $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $store->update(['active_template_key' => $request->validated()['template_key']]);
        Cache::forget("store:slug:{$store->slug}");

        return $this->success([
            'active_template_key' => $store->active_template_key,
        ], 'Template switched.');
    }

    public function showConfig(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $config = StoreTemplateConfig::where('store_id', $store->id)->first();

        return $this->success($config?->config ?? [
            'primary_color'       => $store->primary_color,
            'secondary_color'     => null,
            'font_pair'           => null,
            'layout_columns'      => 3,
            'show_hero'           => true,
            'show_categories_bar' => true,
        ]);
    }

    public function updateConfig(UpdateTemplateConfigRequest $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $config = $request->validated();

        StoreTemplateConfig::updateOrCreate(
            ['store_id' => $store->id],
            ['config'   => $config]
        );

        return $this->success($config, 'Template config saved.');
    }
}
