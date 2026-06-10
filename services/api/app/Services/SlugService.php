<?php

namespace App\Services;

use App\Models\Post;
use App\Models\Product;
use Illuminate\Support\Str;

class SlugService
{
    public function generateForPost(string $englishTitle, ?int $excludeId = null): string
    {
        $base  = Str::slug($englishTitle) ?: 'post';
        $slug  = $base;
        $count = 2;

        while (
            Post::where('slug', $slug)
                ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                ->withTrashed()
                ->exists()
        ) {
            $slug = $base . '-' . $count++;
        }

        return $slug;
    }

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
