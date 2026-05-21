<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status', 'pending');
        $page   = (int) $request->input('page', 1);

        $query = ProductReview::with(['product:id,name,slug', 'store:id,name,slug'])
            ->when($status === 'pending',  fn($q) => $q->where('is_approved', false))
            ->when($status === 'approved', fn($q) => $q->where('is_approved', true))
            ->latest();

        $paginator = $query->paginate(25, ['*'], 'page', $page);

        $data = $paginator->map(fn($r) => [
            'id'             => $r->id,
            'reviewer_name'  => $r->reviewer_name,
            'reviewer_email' => $r->reviewer_email,
            'rating'         => $r->rating,
            'body'           => $r->body,
            'is_approved'    => $r->is_approved,
            'created_at'     => $r->created_at->toDateTimeString(),
            'product'        => [
                'name' => $r->product?->getTranslations('name'),
                'slug' => $r->product?->slug,
            ],
            'store'          => [
                'name' => $r->store?->getTranslations('name'),
                'slug' => $r->store?->slug,
            ],
        ])->values()->all();

        return $this->success([
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    public function approve(ProductReview $review): JsonResponse
    {
        $review->update(['is_approved' => true]);

        $review->loadMissing(['product', 'store']);
        Cache::forget("store:{$review->store->slug}:product:{$review->product->slug}");

        return $this->success(null, 'Review approved.');
    }

    public function destroy(ProductReview $review): JsonResponse
    {
        $review->delete();
        return $this->success(null, 'Review deleted.');
    }
}
