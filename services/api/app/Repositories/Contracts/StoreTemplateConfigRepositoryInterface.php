<?php

namespace App\Repositories\Contracts;

use App\Models\StoreTemplateConfig;

interface StoreTemplateConfigRepositoryInterface
{
    public function findByStore(int $storeId): ?StoreTemplateConfig;

    public function upsert(int $storeId, array $config): StoreTemplateConfig;
}
