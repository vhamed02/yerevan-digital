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
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ImageService;
use App\Services\SlugService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function __construct(
        private readonly ImageService $imageService,
        private readonly SlugService  $slugService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $query = Product::where('store_id', $store->id)
            ->with(['images' => fn($q) => $q->where('is_primary', true), 'category'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('name->en', 'like', "%{$request->search}%")
                    ->orWhere('name->hy', 'like', "%{$request->search}%")
                    ->orWhere('sku', 'like', "%{$request->search}%");
            }));

        $query = match ($request->sort) {
            'price_asc'  => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'stock_low'  => $query->orderBy('stock'),
            default      => $query->latest(),
        };

        return $this->paginated(ProductResource::collection($query->paginate(20)));
    }

    public function show(Request $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = Product::where('store_id', $store->id)
            ->where('uuid', $uuid)
            ->with(['images', 'variants', 'category'])
            ->firstOrFail();

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
        $data['store_id'] = $store->id;

        $product = Product::create($data);

        return $this->success(new ProductDetailResource($product->load(['images', 'variants', 'category'])), 'Product created.', 201);
    }

    public function update(UpdateProductRequest $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = Product::where('store_id', $store->id)->where('uuid', $uuid)->firstOrFail();

        $data = $request->validated();

        if (isset($data['name']) && empty($data['slug'])) {
            $nameEn = $data['name']['en'] ?? $data['name']['hy'];
            $data['slug'] = $this->slugService->generateForProduct($nameEn, $store->id, $product->id);
        }

        $product->update($data);

        return $this->success(new ProductDetailResource($product->fresh(['images', 'variants', 'category'])), 'Product updated.');
    }

    public function destroy(Request $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = Product::where('store_id', $store->id)->where('uuid', $uuid)->firstOrFail();
        $product->delete();

        return $this->success(null, 'Product deleted.');
    }

    public function updateStatus(UpdateProductStatusRequest $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = Product::where('store_id', $store->id)->where('uuid', $uuid)->firstOrFail();
        $product->update(['status' => $request->validated()['status']]);

        return $this->success(['status' => $product->status->value], 'Product status updated.');
    }

    public function uploadImages(Request $request, string $uuid): JsonResponse
    {
        $request->validate([
            'images'    => ['required', 'array', 'max:10'],
            'images.*'  => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $product = Product::where('store_id', $store->id)->where('uuid', $uuid)->firstOrFail();
        $isFirst = !$product->images()->exists();
        $uploaded = [];

        foreach ($request->file('images') as $index => $file) {
            $variants = $this->imageService->storeUpload($file, "products/{$uuid}");

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

        $product = Product::where('store_id', $store->id)->where('uuid', $uuid)->firstOrFail();
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

        $product = Product::where('store_id', $store->id)->where('uuid', $uuid)->firstOrFail();
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
