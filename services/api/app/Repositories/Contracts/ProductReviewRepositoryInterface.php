<?php

namespace App\Repositories\Contracts;

use App\Models\ProductReview;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProductReviewRepositoryInterface
{
    public function paginate(string $status, int $perPage, int $page): LengthAwarePaginator;

    public function approve(ProductReview $review): void;

    public function delete(ProductReview $review): void;

    public function existsByEmailAndProduct(int $productId, string $email): bool;

    public function create(array $data): ProductReview;
}
