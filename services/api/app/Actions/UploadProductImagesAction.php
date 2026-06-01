<?php

namespace App\Actions;

use App\Jobs\ProcessImageVariants;
use App\Models\Product;
use App\Services\ImageService;

class UploadProductImagesAction
{
    public function __construct(private readonly ImageService $imageService) {}

    public function execute(Product $product, array $files, string $storeId): array
    {
        $isFirst  = !$product->images()->exists();
        $uploaded = [];

        foreach ($files as $index => $file) {
            $variants = $this->imageService->prepare($file, 'products', $storeId);

            $uploaded[] = $product->images()->create([
                'path_original'  => $variants['original'],
                'path_thumbnail' => $variants['thumbnail'],
                'path_medium'    => $variants['medium'],
                'path_large'     => $variants['large'],
                'sort_order'     => $product->images()->max('sort_order') + 1,
                'is_primary'     => $isFirst && $index === 0,
            ]);

            ProcessImageVariants::dispatch($variants['source_path'], 'products', $storeId, $variants['uuid']);
        }

        return $uploaded;
    }
}
