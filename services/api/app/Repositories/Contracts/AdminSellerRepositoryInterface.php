<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

interface AdminSellerRepositoryInterface
{
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Model;

    public function findWithDetails(int $id): Model;

    public function updateStatus(int $id, string $status): Model;

    public function updatePassword(int $id, string $password): void;

    public function softDeleteWithStore(int $id): void;

    public function countTotal(): int;

    public function countBetween(\Carbon\Carbon $from, \Carbon\Carbon $to): int;
}
