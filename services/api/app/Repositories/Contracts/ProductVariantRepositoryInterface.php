<?php

namespace App\Repositories\Contracts;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;

interface ProductVariantRepositoryInterface
{
    public function allByProduct(Product $product): Collection;

    public function findByProduct(Product $product, int $variantId): ProductVariant;

    public function findActiveByProductLocked(int $productId, int $variantId): ProductVariant;

    public function create(Product $product, array $data): ProductVariant;

    public function update(ProductVariant $variant, array $data): ProductVariant;

    public function delete(ProductVariant $variant): void;

    public function decrement(int $variantId, int $qty): void;
}
