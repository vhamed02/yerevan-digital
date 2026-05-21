<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

interface AdminStoreRepositoryInterface
{
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Model;

    public function findBySlugWithDetails(string $slug): Model;

    public function approve(string $slug): Model;

    public function suspend(string $slug, ?string $reason = null): Model;

    public function toggleFeatured(string $slug): Model;

    public function softDelete(string $slug): void;

    public function countActive(): int;

    public function countPending(): int;

    public function countBetween(\Carbon\Carbon $from, \Carbon\Carbon $to): int;

    public function pendingWithOwner(int $limit): Collection;

    public function topByRevenue(int $limit): Collection;
}
