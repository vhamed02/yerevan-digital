<?php

namespace App\Http\Controllers\Store;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Store\PublicProductDetailResource;
use App\Http\Resources\Store\PublicProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
    public function index(Request $request, string $slug): JsonResponse
    {
        $store    = $request->attributes->get('currentStore');
        $perPage  = min((int) $request->input('per_page', 20), 50);
        $page     = (int) $request->input('page', 1);
        $category = $request->input('category');
        $sort     = $request->input('sort', 'newest');
        $search   = $request->input('search');
        $featured = $request->boolean('featured');
        $minPrice = $request->input('min_price') !== null ? (float) $request->input('min_price') : null;
        $maxPrice = $request->input('max_price') !== null ? (float) $request->input('max_price') : null;

        $queryHash = md5(json_encode(compact('category', 'sort', 'search', 'featured', 'minPrice', 'maxPrice', 'perPage', 'page')));
        $cacheKey  = "store:{$slug}:products:{$queryHash}";

        $payload = Cache::remember($cacheKey, 120, function () use ($store, $perPage, $page, $category, $sort, $search, $featured, $minPrice, $maxPrice) {
            $query = Product::where('store_id', $store->id)
                ->where('status', ProductStatus::Active)
                ->with(['images', 'category'])
                ->when($category, fn($q) => $q->whereHas('category', fn($q) => $q->where('slug', $category)))
                ->when($search, fn($q) => $q->where(function ($q) use ($search) {
                    $q->where('name->en', 'like', "%{$search}%")
                      ->orWhere('name->hy', 'like', "%{$search}%");
                }))
                ->when($featured, fn($q) => $q->where('is_featured', true))
                ->when($minPrice !== null, fn($q) => $q->where('price', '>=', $minPrice))
                ->when($maxPrice !== null, fn($q) => $q->where('price', '<=', $maxPrice));

            $query = match ($sort) {
                'price_asc'  => $query->orderBy('price'),
                'price_desc' => $query->orderByDesc('price'),
                'featured'   => $query->orderByDesc('is_featured')->latest(),
                default      => $query->latest(),
            };

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'data' => PublicProductResource::collection($paginator->items())->resolve(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page'    => $paginator->lastPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                ],
            ];
        });

        return $this->success($payload);
    }

    public function show(Request $request, string $slug, string $productSlug): JsonResponse
    {
        $store    = $request->attributes->get('currentStore');
        $cacheKey = "store:{$slug}:product:{$productSlug}";

        $payload = Cache::remember($cacheKey, 60, function () use ($store, $productSlug) {
            $product = Product::where('store_id', $store->id)
                ->where('slug', $productSlug)
                ->where('status', ProductStatus::Active)
                ->with([
                    'images',
                    'variants' => fn($q) => $q->where('is_active', true),
                    'category',
                    'reviews'  => fn($q) => $q->where('is_approved', true)->latest()->limit(50),
                ])
                ->firstOrFail();

            return (new PublicProductDetailResource($product))->resolve();
        });

        return $this->success($payload);
    }
}
