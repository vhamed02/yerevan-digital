<?php

namespace App\Http\Controllers\Customer;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Store\PublicProductResource;
use App\Models\Product;
use App\Models\WishlistItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = WishlistItem::forUser($request->user()->id)
            ->with(['product.images', 'product.store'])
            ->latest('id')
            ->get()
            // A product can be archived or deleted after being saved.
            ->filter(fn (WishlistItem $item) => $item->product !== null)
            ->map(fn (WishlistItem $item) => [
                'saved_at'   => $item->created_at?->toIso8601String(),
                'store_slug' => $item->product->store?->slug,
                'product'    => (new PublicProductResource($item->product))->resolve(),
            ])
            ->values()
            ->all();

        return $this->success($items);
    }

    /** Ids only — cheap enough for a storefront to call on load and mark hearts. */
    public function ids(Request $request): JsonResponse
    {
        $uuids = WishlistItem::forUser($request->user()->id)
            ->join('products', 'products.id', '=', 'wishlist_items.product_id')
            ->pluck('products.uuid')
            ->all();

        return $this->success(['product_uuids' => $uuids]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_uuid' => ['required', 'string'],
        ]);

        $product = Product::where('uuid', $validated['product_uuid'])
            ->where('status', ProductStatus::Active)
            ->first();

        if (! $product) {
            return $this->error('Product not found.', 404);
        }

        // Idempotent: saving twice is not an error, and the unique index makes
        // a concurrent double-tap safe.
        WishlistItem::firstOrCreate([
            'user_id'    => $request->user()->id,
            'product_id' => $product->id,
        ]);

        return $this->success(null, 'Saved to your wishlist.', 201);
    }

    public function destroy(Request $request, string $productUuid): JsonResponse
    {
        $productId = Product::where('uuid', $productUuid)->value('id');

        if ($productId === null) {
            return $this->error('Product not found.', 404);
        }

        WishlistItem::forUser($request->user()->id)
            ->where('product_id', $productId)
            ->delete();

        return $this->success(null, 'Removed from your wishlist.');
    }
}
