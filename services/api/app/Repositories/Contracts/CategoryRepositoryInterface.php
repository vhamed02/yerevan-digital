<?php

namespace App\Repositories\Contracts;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

interface CategoryRepositoryInterface
{
    public function treeWithProductCounts(): Collection;

    public function create(array $data): Category;

    public function update(Category $category, array $data): Category;

    public function delete(Category $category): bool;

    public function reorder(array $order): void;

    public function activeForStore(int $storeId): array;

    public function allActive(): Collection;
}
