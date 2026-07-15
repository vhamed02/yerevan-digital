<?php

namespace App\Repositories\Eloquent;

use App\Enums\ProductStatus;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductRepository implements ProductRepositoryInterface
{
    /**
     * Cap on ids pulled back from the search engine before SQL filters run.
     * A storefront catalogue is small; this only bounds a pathological query.
     */
    private const SEARCH_ID_LIMIT = 500;

    public function paginateByStore(int $storeId, array $filters, string $sort, int $perPage): LengthAwarePaginator
    {
        $query = Product::where('store_id', $storeId)
            ->with(['images' => fn($q) => $q->where('is_primary', true), 'category'])
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($filters['category_id'] ?? null, fn($q, $v) => $q->where('category_id', $v))
            ->when($filters['search'] ?? null, fn($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('name->en', 'like', "%{$v}%")
                    ->orWhere('name->hy', 'like', "%{$v}%")
                    ->orWhere('sku', 'like', "%{$v}%");
            }));

        return (match ($sort) {
            'price_asc'  => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'stock_low'  => $query->orderBy('stock'),
            default      => $query->latest(),
        })->paginate($perPage);
    }

    public function findByStoreAndUuid(int $storeId, string $uuid, array $with = []): Product
    {
        return Product::where('store_id', $storeId)
            ->where('uuid', $uuid)
            ->with($with)
            ->firstOrFail();
    }

    public function findByStoreAndSlug(int $storeId, string $slug, array $with = []): Product
    {
        return Product::where('store_id', $storeId)
            ->where('slug', $slug)
            ->with($with)
            ->firstOrFail();
    }

    public function slugExists(int $storeId, string $slug, ?string $excludeUuid = null): bool
    {
        return Product::where('store_id', $storeId)
            ->where('slug', $slug)
            ->when($excludeUuid, fn($q) => $q->where('uuid', '!=', $excludeUuid))
            ->exists();
    }

    public function createForStore(int $storeId, array $data): Product
    {
        return Product::create(array_merge($data, ['store_id' => $storeId]));
    }

    public function update(Product $product, array $data): Product
    {
        $product->update($data);
        return $product;
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }

    public function duplicate(Product $product, string $newUuid, string $newSlug): Product
    {
        $copy = $product->replicate(['uuid']);
        $copy->uuid = $newUuid;
        $copy->slug = $newSlug;
        $copy->status = ProductStatus::Draft;
        $copy->is_featured = false;
        $copy->save();

        return $copy;
    }

    public function paginatePublicByStore(int $storeId, array $filters, string $sort, int $perPage, int $page): LengthAwarePaginator
    {
        $searchTerm = $filters['search'] ?? null;
        $matchedIds = $searchTerm ? $this->searchProductIds($storeId, (string) $searchTerm) : null;

        $query = Product::where('store_id', $storeId)
            ->where('status', ProductStatus::Active)
            ->with(['images', 'category'])
            ->when($filters['category'] ?? null, fn($q, $v) => $q->whereHas('category', fn($q) => $q->where('slug', $v)))
            // Meilisearch narrows to matching ids; every other filter and the
            // sort stay in SQL, so search composes with them unchanged.
            ->when($matchedIds !== null, fn($q) => $q->whereIn('id', $matchedIds))
            ->when($matchedIds === null && $searchTerm, fn($q) => $q->where(function ($q) use ($searchTerm) {
                $q->where('name->en', 'like', "%{$searchTerm}%")
                    ->orWhere('name->hy', 'like', "%{$searchTerm}%")
                    ->orWhere('name->ru', 'like', "%{$searchTerm}%")
                    ->orWhere('sku', 'like', "%{$searchTerm}%");
            }))
            ->when($filters['featured'] ?? false, fn($q) => $q->where('is_featured', true))
            ->when($filters['in_stock'] ?? false, fn($q) => $q->where(fn($q) =>
                $q->where('manage_stock', false)->orWhere('stock', '>', 0)
            ))
            ->when($filters['on_sale'] ?? false, fn($q) =>
                $q->whereNotNull('compare_price')->whereColumn('compare_price', '>', 'price')
            )
            ->when(isset($filters['min_price']), fn($q) => $q->where('price', '>=', $filters['min_price']))
            ->when(isset($filters['max_price']), fn($q) => $q->where('price', '<=', $filters['max_price']));

        return (match ($sort) {
            'price_asc'  => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'featured'   => $query->orderByDesc('is_featured')->latest(),
            default      => $query->latest(),
        })->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Product ids matching a storefront search, via Meilisearch.
     *
     * Returns null to mean "no search engine — use the SQL LIKE fallback",
     * which is also what happens if Meilisearch is unreachable: a search outage
     * degrades the results rather than 500ing the storefront.
     *
     * @return int[]|null
     */
    private function searchProductIds(int $storeId, string $term): ?array
    {
        if (config('scout.driver') !== 'meilisearch') {
            return null;
        }

        try {
            return Product::search($term)
                ->where('store_id', $storeId)
                ->where('status', ProductStatus::Active->value)
                ->take(self::SEARCH_ID_LIMIT)
                ->keys()
                ->map(fn ($id) => (int) $id)
                ->all();
        } catch (\Throwable $e) {
            report($e);

            return null;
        }
    }

    public function findPublicByStoreAndSlug(int $storeId, string $slug, array $with = []): Product
    {
        return Product::where('store_id', $storeId)
            ->where('slug', $slug)
            ->where('status', ProductStatus::Active)
            ->with($with)
            ->firstOrFail();
    }

    public function findActiveByStoreAndUuid(int $storeId, string $uuid, bool $lock = false): Product
    {
        $query = Product::where('uuid', $uuid)
            ->where('store_id', $storeId)
            ->where('status', ProductStatus::Active);

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->firstOrFail();
    }

    public function maxPriceForStore(int $storeId): float
    {
        return (float) Product::where('store_id', $storeId)
            ->where('status', ProductStatus::Active)
            ->max('price') ?? 0;
    }

    public function countStatsByStore(int $storeId): array
    {
        $base = Product::where('store_id', $storeId);

        return [
            'total_products'  => (clone $base)->count(),
            'active_products' => (clone $base)->where('status', ProductStatus::Active)->count(),
            'total_views'     => (int) (clone $base)->sum('view_count'),
        ];
    }

    public function statusBreakdownByStore(int $storeId): array
    {
        $base = Product::where('store_id', $storeId);

        return [
            'total'    => (clone $base)->count(),
            'active'   => (clone $base)->where('status', ProductStatus::Active)->count(),
            'draft'    => (clone $base)->where('status', ProductStatus::Draft)->count(),
            'archived' => (clone $base)->where('status', ProductStatus::Archived)->count(),
        ];
    }
}
