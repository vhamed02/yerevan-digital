<?php

namespace App\Actions;

use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ImageService;
use Illuminate\Http\UploadedFile;

class UploadProductImagesAction
{
    public function __construct(private readonly ImageService $imageService) {}

    /**
     * Process and attach uploaded image files to a product.
     *
     * The first image of the product's first-ever upload becomes the primary.
     *
     * @param  array<int, UploadedFile> $files
     * @return array<int, ProductImage>
     */
    public function execute(Product $product, array $files, string $storeId): array
    {
        $isFirst  = !$product->images()->exists();
        $uploaded = [];

        foreach ($files as $index => $file) {
            $variants = $this->imageService->process($file, 'products', $storeId);

            $uploaded[] = $product->images()->create([
                'path_original'  => $variants['original'],
                'path_thumbnail' => $variants['thumbnail'],
                'path_medium'    => $variants['medium'],
                'path_large'     => $variants['large'],
                'sort_order'     => $product->images()->max('sort_order') + 1,
                'is_primary'     => $isFirst && $index === 0,
            ]);
        }

        return $uploaded;
    }
}
