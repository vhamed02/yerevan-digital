<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Str;

class SlugService
{
    public function generateForProduct(string $englishName, int $storeId, ?int $excludeId = null): string
    {
        $base  = Str::slug($englishName) ?: 'product';
        $slug  = $base;
        $count = 2;

        while (
            Product::where('store_id', $storeId)
                ->where('slug', $slug)
                ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                ->withTrashed()
                ->exists()
        ) {
            $slug = $base . '-' . $count++;
        }

        return $slug;
    }
}
