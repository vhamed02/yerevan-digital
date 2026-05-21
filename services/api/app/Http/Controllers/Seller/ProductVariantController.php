<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\CreateVariantRequest;
use App\Http\Requests\Seller\UpdateVariantRequest;
use App\Http\Resources\Seller\ProductVariantResource;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\ProductVariantRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    public function __construct(
        private readonly ProductRepositoryInterface        $products,
        private readonly ProductVariantRepositoryInterface $variants,
    ) {}

    private function resolveProduct(Request $request, string $uuid): Product
    {
        $store = $request->attributes->get('sellerStore');
        abort_if(!$store, 404, 'You have not created a store yet.');

        return $this->products->findByStoreAndUuid($store->id, $uuid);
    }

    public function index(Request $request, string $uuid): JsonResponse
    {
        $product = $this->resolveProduct($request, $uuid);

        return $this->success(ProductVariantResource::collection($this->variants->allByProduct($product)));
    }

    public function store(CreateVariantRequest $request, string $uuid): JsonResponse
    {
        $product = $this->resolveProduct($request, $uuid);
        $variant = $this->variants->create($product, $request->validated());

        return $this->success(new ProductVariantResource($variant), 'Variant created.', 201);
    }

    public function show(Request $request, string $uuid, int $variant): JsonResponse
    {
        $product = $this->resolveProduct($request, $uuid);
        $record = $this->variants->findByProduct($product, $variant);

        return $this->success(new ProductVariantResource($record));
    }

    public function update(UpdateVariantRequest $request, string $uuid, int $variant): JsonResponse
    {
        $product = $this->resolveProduct($request, $uuid);
        $record = $this->variants->findByProduct($product, $variant);
        $updated = $this->variants->update($record, $request->validated());

        return $this->success(new ProductVariantResource($updated), 'Variant updated.');
    }

    public function destroy(Request $request, string $uuid, int $variant): JsonResponse
    {
        $product = $this->resolveProduct($request, $uuid);
        $record = $this->variants->findByProduct($product, $variant);
        $this->variants->delete($record);

        return $this->success(null, 'Variant deleted.');
    }
}
