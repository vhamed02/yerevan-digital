<?php

namespace App\Actions;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ReorderProductImagesAction
{
    /**
     * Persist a new image ordering; the image at position 0 becomes primary.
     *
     * @param  array<int, int> $order Image IDs in their desired display order.
     * @return Collection<int, \App\Models\ProductImage>
     */
    public function execute(Product $product, array $order): Collection
    {
        DB::transaction(function () use ($product, $order) {
            $product->images()->update(['is_primary' => false]);

            foreach ($order as $position => $id) {
                $product->images()->where('id', $id)->update([
                    'sort_order' => $position,
                    'is_primary' => $position === 0,
                ]);
            }
        });

        return $product->images()->orderBy('sort_order')->get();
    }
}
