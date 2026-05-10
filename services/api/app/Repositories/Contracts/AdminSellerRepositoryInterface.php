<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

interface AdminSellerRepositoryInterface
{
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function findWithDetails(int $id): Model;

    public function updateStatus(int $id, string $status): Model;

    public function softDeleteWithStore(int $id): void;
}
