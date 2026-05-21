<?php

namespace App\Repositories\Eloquent;

use App\Models\Product;
use App\Repositories\Contracts\ProductViewRepositoryInterface;

class ProductViewRepository implements ProductViewRepositoryInterface
{
    public function increment(int $productId): void
    {
        Product::where('id', $productId)->increment('view_count');
    }
}
