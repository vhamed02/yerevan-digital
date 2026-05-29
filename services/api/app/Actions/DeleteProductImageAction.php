<?php

namespace App\Actions;

use App\Models\Product;

class DeleteProductImageAction
{
    /**
     * Delete a product image, promoting the next image to primary if needed.
     */
    public function execute(Product $product, int $imageId): void
    {
        $image      = $product->images()->findOrFail($imageId);
        $wasPrimary = $image->is_primary;
        $image->delete();

        if ($wasPrimary) {
            $product->images()->oldest('sort_order')->first()?->update(['is_primary' => true]);
        }
    }
}
