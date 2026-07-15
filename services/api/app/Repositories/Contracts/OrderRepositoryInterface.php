<?php

namespace App\Repositories\Contracts;

use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface OrderRepositoryInterface
{
    public function paginateByStore(int $storeId, array $filters): LengthAwarePaginator;

    public function findByStoreAndUuid(int $storeId, string $uuid, array $with = []): Order;

    public function create(array $data): Order;

    public function update(Order $order, array $data): Order;

    public function recentByStore(int $storeId, int $limit = 5): Collection;

    public function findPublicByStoreAndUuid(int $storeId, string $uuid, array $with = []): Order;

    public function paginateByCustomer(int $customerId, array $filters): LengthAwarePaginator;

    public function findByCustomerAndUuid(int $customerId, string $uuid, array $with = []): Order;

    public function findByOrderNumberAndEmail(string $orderNumber, string $email): ?Order;

    public function countToday(): int;

    public function countYesterday(): int;

    public function revenueBetween(\Carbon\Carbon $from, \Carbon\Carbon $to): float;

    public function revenueTotal(): float;

    public function chartLast30Days(): array;

    public function countsByStatus(): array;

    public function recentWithStore(int $limit): Collection;

    public function countAll(): int;

    public function statsByStore(int $storeId): array;

    public function revenueChartByStore(int $storeId): array;

    public function topProductsByStore(int $storeId, int $limit = 5): array;

    public function ordersByStatusByStore(int $storeId): array;

    public function statusBreakdownByStore(int $storeId): array;

    public function revenueSummaryByStore(int $storeId): array;
}
