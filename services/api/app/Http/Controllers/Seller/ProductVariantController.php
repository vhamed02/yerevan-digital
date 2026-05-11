<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\CreateVariantRequest;
use App\Http\Requests\Seller\UpdateVariantRequest;
use App\Http\Resources\Seller\ProductVariantResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    private function resolveProduct(Request $request, string $uuid): Product
    {
        $store = $request->attributes->get('sellerStore');
        abort_if(!$store, 404, 'You have not created a store yet.');

        return Product::where('store_id', $store->id)->where('uuid', $uuid)->firstOrFail();
    }

    public function index(Request $request, string $uuid): JsonResponse
    {
        $product = $this->resolveProduct($request, $uuid);

        return $this->success(ProductVariantResource::collection($product->variants));
    }

    public function store(CreateVariantRequest $request, string $uuid): JsonResponse
    {
        $product = $this->resolveProduct($request, $uuid);
        $variant = $product->variants()->create($request->validated());

        return $this->success(new ProductVariantResource($variant), 'Variant created.', 201);
    }

    public function show(Request $request, string $uuid, int $variant): JsonResponse
    {
        $product = $this->resolveProduct($request, $uuid);
        $variant = $product->variants()->findOrFail($variant);

        return $this->success(new ProductVariantResource($variant));
    }

    public function update(UpdateVariantRequest $request, string $uuid, int $variant): JsonResponse
    {
        $product = $this->resolveProduct($request, $uuid);
        $variant = $product->variants()->findOrFail($variant);
        $variant->update($request->validated());

        return $this->success(new ProductVariantResource($variant->fresh()), 'Variant updated.');
    }

    public function destroy(Request $request, string $uuid, int $variant): JsonResponse
    {
        $product = $this->resolveProduct($request, $uuid);
        $product->variants()->findOrFail($variant)->delete();

        return $this->success(null, 'Variant deleted.');
    }
}
