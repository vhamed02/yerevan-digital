<?php

namespace App\Repositories\Contracts;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProductRepositoryInterface
{
    public function paginateByStore(int $storeId, array $filters, string $sort, int $perPage): LengthAwarePaginator;

    public function findByStoreAndUuid(int $storeId, string $uuid, array $with = []): Product;

    public function findByStoreAndSlug(int $storeId, string $slug, array $with = []): Product;

    public function slugExists(int $storeId, string $slug, ?string $excludeUuid = null): bool;

    public function createForStore(int $storeId, array $data): Product;

    public function update(Product $product, array $data): Product;

    public function delete(Product $product): void;

    public function duplicate(Product $product, string $newUuid, string $newSlug): Product;

    public function paginatePublicByStore(int $storeId, array $filters, string $sort, int $perPage, int $page): LengthAwarePaginator;

    public function findPublicByStoreAndSlug(int $storeId, string $slug, array $with = []): Product;

    public function findActiveByStoreAndUuid(int $storeId, string $uuid, bool $lock = false): Product;
}
