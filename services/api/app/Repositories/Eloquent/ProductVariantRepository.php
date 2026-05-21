<?php

namespace App\Repositories\Eloquent;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Repositories\Contracts\ProductVariantRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ProductVariantRepository implements ProductVariantRepositoryInterface
{
    public function allByProduct(Product $product): Collection
    {
        return $product->variants()->get();
    }

    public function findByProduct(Product $product, int $variantId): ProductVariant
    {
        return $product->variants()->findOrFail($variantId);
    }

    public function findActiveByProductLocked(int $productId, int $variantId): ProductVariant
    {
        return ProductVariant::where('id', $variantId)
            ->where('product_id', $productId)
            ->where('is_active', true)
            ->lockForUpdate()
            ->firstOrFail();
    }

    public function create(Product $product, array $data): ProductVariant
    {
        return $product->variants()->create($data);
    }

    public function update(ProductVariant $variant, array $data): ProductVariant
    {
        $variant->update($data);
        return $variant->fresh();
    }

    public function delete(ProductVariant $variant): void
    {
        $variant->delete();
    }

    public function decrement(int $variantId, int $qty): void
    {
        ProductVariant::where('id', $variantId)->decrement('stock', $qty);
    }
}
