<?php

namespace App\Repositories\Eloquent;

use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CategoryRepository implements CategoryRepositoryInterface
{
    public function treeWithProductCounts(): Collection
    {
        return Category::withCount('products as product_count')
            ->with(['children' => fn($q) => $q->withCount('products as product_count')
                ->with(['children' => fn($q) => $q->withCount('products as product_count')])])
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get();
    }

    public function create(array $data): Category
    {
        return Category::create($data);
    }

    public function update(Category $category, array $data): Category
    {
        $category->update($data);
        return $category;
    }

    public function delete(Category $category): bool
    {
        return (bool) $category->delete();
    }

    public function reorder(array $order): void
    {
        DB::transaction(function () use ($order) {
            foreach ($order as $position => $id) {
                Category::where('id', $id)->update(['sort_order' => $position]);
            }
        });
    }

    public function activeForStore(int $storeId): array
    {
        return Category::active()
            ->whereHas('products', fn($q) => $q->active()->where('store_id', $storeId))
            ->withCount(['products as product_count' => fn($q) => $q->active()->where('store_id', $storeId)])
            ->orderBy('sort_order')
            ->get()
            ->map(fn($cat) => [
                'id'            => $cat->id,
                'name'          => $cat->getTranslations('name'),
                'slug'          => $cat->slug,
                'product_count' => $cat->product_count,
            ])
            ->values()
            ->all();
    }

    public function allActive(): Collection
    {
        return Category::active()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'name', 'slug', 'parent_id', 'icon']);
    }
}
