<?php

namespace App\Http\Controllers\Seller;

use App\Actions\DeleteProductImageAction;
use App\Actions\ReorderProductImagesAction;
use App\Actions\UploadProductImagesAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\CreateProductRequest;
use App\Http\Requests\Seller\ReorderImagesRequest;
use App\Http\Requests\Seller\UpdateProductRequest;
use App\Http\Requests\Seller\UpdateProductStatusRequest;
use App\Http\Resources\Seller\ProductDetailResource;
use App\Http\Resources\Seller\ProductImageResource;
use App\Http\Resources\Seller\ProductResource;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Services\SlugService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductRepositoryInterface $products,
        private readonly SlugService                $slugService,
    ) {}

    public function checkSlug(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $request->validate([
            'slug'    => ['required', 'string', 'regex:/^[a-z0-9-]+$/'],
            'exclude' => ['sometimes', 'nullable', 'string'],
        ]);

        if ($this->products->slugExists($store->id, $request->input('slug'), $request->input('exclude'))) {
            return $this->error('Slug is already taken.', 409);
        }

        return $this->success(['available' => true]);
    }

    public function index(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $filters = $request->only(['status', 'category_id', 'search']);
        $paginator = $this->products->paginateByStore($store->id, $filters, $request->input('sort', ''), 20);

        return $this->paginated(ProductResource::collection($paginator));
    }

    public function show(Request $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = $this->products->findByStoreAndUuid($store->id, $uuid, ['images', 'variants', 'category']);

        return $this->success(new ProductDetailResource($product));
    }

    public function store(CreateProductRequest $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $data = $request->validated();
        $nameEn = $data['name']['en'] ?? $data['name']['hy'];
        $data['slug'] = empty($data['slug'])
            ? $this->slugService->generateForProduct($nameEn, $store->id)
            : $data['slug'];

        $product = $this->products->createForStore($store->id, $data);

        return $this->success(new ProductDetailResource($product->load(['images', 'variants', 'category'])), 'Product created.', 201);
    }

    public function update(UpdateProductRequest $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = $this->products->findByStoreAndUuid($store->id, $uuid);
        $data = $request->validated();

        if (isset($data['name']) && empty($data['slug'])) {
            $nameEn = $data['name']['en'] ?? $data['name']['hy'];
            $data['slug'] = $this->slugService->generateForProduct($nameEn, $store->id, $product->id);
        }

        $this->products->update($product, $data);

        return $this->success(new ProductDetailResource($product->fresh(['images', 'variants', 'category'])), 'Product updated.');
    }

    public function destroy(Request $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = $this->products->findByStoreAndUuid($store->id, $uuid);
        $this->products->delete($product);

        return $this->success(null, 'Product deleted.');
    }

    public function duplicate(Request $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = $this->products->findByStoreAndUuid($store->id, $uuid);

        $nameEn = $product->name['en'] ?? $product->name['hy'];
        $newSlug = $this->slugService->generateForProduct($nameEn . ' copy', $store->id);

        $copy = $this->products->duplicate($product, (string) Str::uuid(), $newSlug);

        return $this->success(new ProductDetailResource($copy->load(['images', 'variants', 'category'])), 'Product duplicated.', 201);
    }

    public function updateStatus(UpdateProductStatusRequest $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = $this->products->findByStoreAndUuid($store->id, $uuid);
        $this->products->update($product, ['status' => $request->validated()['status']]);

        return $this->success(['status' => $product->fresh()->status->value], 'Product status updated.');
    }

    public function uploadImages(Request $request, string $uuid, UploadProductImagesAction $upload): JsonResponse
    {
        $request->validate([
            'images'   => ['required', 'array', 'max:10'],
            'images.*' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = $this->products->findByStoreAndUuid($store->id, $uuid);
        $images  = $upload->execute($product, $request->file('images'), (string) $store->id);

        return $this->success(ProductImageResource::collection($images), 'Images uploaded.', 201);
    }

    public function deleteImage(Request $request, string $uuid, int $imageId, DeleteProductImageAction $delete): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = $this->products->findByStoreAndUuid($store->id, $uuid);
        $delete->execute($product, $imageId);

        return $this->success(null, 'Image deleted.');
    }

    public function reorderImages(ReorderImagesRequest $request, string $uuid, ReorderProductImagesAction $reorder): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = $this->products->findByStoreAndUuid($store->id, $uuid);
        $images  = $reorder->execute($product, $request->validated()['order']);

        return $this->success(ProductImageResource::collection($images), 'Images reordered.');
    }
}
