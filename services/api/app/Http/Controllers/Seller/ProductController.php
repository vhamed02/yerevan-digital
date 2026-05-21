<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\CreateProductRequest;
use App\Http\Requests\Seller\ReorderImagesRequest;
use App\Http\Requests\Seller\UpdateProductRequest;
use App\Http\Requests\Seller\UpdateProductStatusRequest;
use App\Http\Resources\Seller\ProductDetailResource;
use App\Http\Resources\Seller\ProductImageResource;
use App\Http\Resources\Seller\ProductResource;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Services\ImageService;
use App\Services\SlugService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductRepositoryInterface $products,
        private readonly ImageService               $imageService,
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

    public function uploadImages(Request $request, string $uuid): JsonResponse
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
        $isFirst = !$product->images()->exists();
        $uploaded = [];

        foreach ($request->file('images') as $index => $file) {
            $variants = $this->imageService->process($file, 'products', (string) $store->id);

            $image = $product->images()->create([
                'path_original'  => $variants['original'],
                'path_thumbnail' => $variants['thumbnail'],
                'path_medium'    => $variants['medium'],
                'path_large'     => $variants['large'],
                'sort_order'     => $product->images()->max('sort_order') + 1,
                'is_primary'     => $isFirst && $index === 0,
            ]);

            $uploaded[] = new ProductImageResource($image);
        }

        return $this->success($uploaded, 'Images uploaded.', 201);
    }

    public function deleteImage(Request $request, string $uuid, int $imageId): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = $this->products->findByStoreAndUuid($store->id, $uuid);
        $image = $product->images()->findOrFail($imageId);
        $wasPrimary = $image->is_primary;
        $image->delete();

        if ($wasPrimary) {
            $product->images()->oldest('sort_order')->first()?->update(['is_primary' => true]);
        }

        return $this->success(null, 'Image deleted.');
    }

    public function reorderImages(ReorderImagesRequest $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = $this->products->findByStoreAndUuid($store->id, $uuid);
        $order = $request->validated()['order'];

        DB::transaction(function () use ($product, $order) {
            $product->images()->update(['is_primary' => false]);

            foreach ($order as $position => $id) {
                $product->images()->where('id', $id)->update([
                    'sort_order' => $position,
                    'is_primary' => $position === 0,
                ]);
            }
        });

        return $this->success(
            ProductImageResource::collection($product->images()->orderBy('sort_order')->get()),
            'Images reordered.'
        );
    }
}
