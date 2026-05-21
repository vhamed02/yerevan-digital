<?php

namespace App\Repositories\Eloquent;

use App\Models\StoreTemplateConfig;
use App\Repositories\Contracts\StoreTemplateConfigRepositoryInterface;

class StoreTemplateConfigRepository implements StoreTemplateConfigRepositoryInterface
{
    public function findByStore(int $storeId): ?StoreTemplateConfig
    {
        return StoreTemplateConfig::where('store_id', $storeId)->first();
    }

    public function upsert(int $storeId, array $config): StoreTemplateConfig
    {
        return StoreTemplateConfig::updateOrCreate(
            ['store_id' => $storeId],
            ['config'   => $config]
        );
    }
}
