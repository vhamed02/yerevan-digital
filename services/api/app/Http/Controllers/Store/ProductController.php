<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Resources\Store\PublicProductDetailResource;
use App\Http\Resources\Store\PublicProductResource;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
    public function __construct(private readonly ProductRepositoryInterface $products) {}

    public function index(Request $request, string $slug): JsonResponse
    {
        $store   = $request->attributes->get('currentStore');
        $perPage = min((int) $request->input('per_page', 20), 50);
        $page    = (int) $request->input('page', 1);
        $sort    = $request->input('sort', 'newest');

        $filters = [
            'category'  => $request->input('category'),
            'search'    => $request->input('search'),
            'featured'  => $request->boolean('featured'),
            'min_price' => $request->input('min_price') !== null ? (float) $request->input('min_price') : null,
            'max_price' => $request->input('max_price') !== null ? (float) $request->input('max_price') : null,
        ];

        $queryHash = md5(json_encode(compact('filters', 'sort', 'perPage', 'page')));
        $cacheKey  = "store:{$slug}:products:{$queryHash}";

        $payload = Cache::remember($cacheKey, 120, function () use ($store, $filters, $sort, $perPage, $page) {
            $paginator = $this->products->paginatePublicByStore($store->id, $filters, $sort, $perPage, $page);

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
            $product = $this->products->findPublicByStoreAndSlug($store->id, $productSlug, [
                'images',
                'variants' => fn($q) => $q->where('is_active', true),
                'category',
                'reviews'  => fn($q) => $q->where('is_approved', true)->latest()->limit(50),
            ]);

            return (new PublicProductDetailResource($product))->resolve();
        });

        return $this->success($payload);
    }
}
