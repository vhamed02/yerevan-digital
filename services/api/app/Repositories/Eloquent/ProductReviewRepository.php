<?php

namespace App\Repositories\Eloquent;

use App\Models\ProductReview;
use App\Repositories\Contracts\ProductReviewRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductReviewRepository implements ProductReviewRepositoryInterface
{
    public function paginate(string $status, int $perPage, int $page): LengthAwarePaginator
    {
        return ProductReview::with(['product:id,name,slug', 'store:id,name,slug'])
            ->when($status === 'pending',  fn($q) => $q->where('is_approved', false))
            ->when($status === 'approved', fn($q) => $q->where('is_approved', true))
            ->latest()
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function approve(ProductReview $review): void
    {
        $review->update(['is_approved' => true]);
    }

    public function delete(ProductReview $review): void
    {
        $review->delete();
    }

    public function existsByEmailAndProduct(int $productId, string $email): bool
    {
        return ProductReview::where('product_id', $productId)
            ->where('reviewer_email', $email)
            ->exists();
    }

    public function create(array $data): ProductReview
    {
        return ProductReview::create($data);
    }
}
