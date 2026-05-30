<?php

namespace App\Repositories\Eloquent;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class OrderRepository implements OrderRepositoryInterface
{
    public function paginateByStore(int $storeId, array $filters): LengthAwarePaginator
    {
        return Order::where('store_id', $storeId)
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($filters['payment_status'] ?? null, fn($q, $v) => $q->where('payment_status', $v))
            ->when($filters['date_from'] ?? null, fn($q, $v) => $q->where('created_at', '>=', Carbon::parse($v)->startOfDay()))
            ->when($filters['date_to'] ?? null, fn($q, $v) => $q->where('created_at', '<=', Carbon::parse($v)->endOfDay()))
            ->when($filters['search'] ?? null, fn($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('order_number', 'like', "%{$v}%")
                    ->orWhere('customer_name', 'like', "%{$v}%");
            }))
            ->latest()
            ->paginate(20);
    }

    public function findByStoreAndUuid(int $storeId, string $uuid, array $with = []): Order
    {
        return Order::where('store_id', $storeId)
            ->where('uuid', $uuid)
            ->with($with)
            ->firstOrFail();
    }

    public function create(array $data): Order
    {
        return Order::create($data);
    }

    public function update(Order $order, array $data): Order
    {
        $order->update($data);
        return $order;
    }

    public function recentByStore(int $storeId, int $limit = 5): Collection
    {
        return Order::where('store_id', $storeId)
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function findPublicByStoreAndUuid(int $storeId, string $uuid, array $with = []): Order
    {
        return Order::where('store_id', $storeId)
            ->where('uuid', $uuid)
            ->with($with)
            ->firstOrFail();
    }

    public function countToday(): int
    {
        return Order::whereBetween('created_at', [today(), today()->endOfDay()])->count();
    }

    public function countYesterday(): int
    {
        return Order::whereBetween('created_at', [today()->subDay(), today()->subDay()->endOfDay()])->count();
    }

    public function revenueBetween(\Carbon\Carbon $from, \Carbon\Carbon $to): float
    {
        return (float) Order::whereBetween('created_at', [$from, $to])->sum('total');
    }

    public function revenueTotal(): float
    {
        return (float) Order::sum('total');
    }

    public function chartLast30Days(): array
    {
        return Order::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->whereBetween('created_at', [now()->subDays(29)->startOfDay(), now()->endOfDay()])
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->map(fn($row) => ['date' => $row->date, 'count' => (int) $row->count])
            ->values()
            ->all();
    }

    public function countsByStatus(): array
    {
        return Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn($row) => ['status' => $row->status->value, 'count' => (int) $row->count])
            ->values()
            ->all();
    }

    public function recentWithStore(int $limit): Collection
    {
        return Order::with('store')->latest()->limit($limit)->get();
    }

    public function countAll(): int
    {
        return Order::count();
    }

    public function statsByStore(int $storeId): array
    {
        $base = Order::where('store_id', $storeId);

        return [
            'total_orders'       => (clone $base)->count(),
            'orders_this_month'  => (clone $base)->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->count(),
            'revenue_this_month' => (float) (clone $base)->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('total'),
            'revenue_today'      => (float) (clone $base)->whereBetween('created_at', [today(), today()->endOfDay()])->sum('total'),
        ];
    }

    public function revenueChartByStore(int $storeId): array
    {
        $rows = Order::where('store_id', $storeId)
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->select('created_at', 'total')
            ->get()
            ->groupBy(fn($row) => substr($row->created_at, 0, 10));

        $chart = [];
        for ($i = 13; $i >= 0; $i--) {
            $date    = now()->subDays($i)->toDateString();
            $chart[] = [
                'date'    => $date,
                'revenue' => (float) ($rows->get($date)?->sum('total') ?? 0),
            ];
        }

        return $chart;
    }

    public function ordersByStatusByStore(int $storeId): array
    {
        return Order::where('store_id', $storeId)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn($row) => ['status' => $row->status->value, 'count' => (int) $row->count])
            ->values()
            ->all();
    }

    public function statusBreakdownByStore(int $storeId): array
    {
        $base = Order::where('store_id', $storeId);

        return [
            'total'      => (clone $base)->count(),
            'pending'    => (clone $base)->where('status', OrderStatus::Pending)->count(),
            'processing' => (clone $base)->where('status', OrderStatus::Processing)->count(),
            'shipped'    => (clone $base)->where('status', OrderStatus::Shipped)->count(),
            'today'      => (clone $base)->whereBetween('created_at', [today(), today()->endOfDay()])->count(),
        ];
    }

    public function revenueSummaryByStore(int $storeId): array
    {
        $base = Order::where('store_id', $storeId);

        return [
            'total'      => (float) (clone $base)->sum('total'),
            'this_month' => (float) (clone $base)->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('total'),
            'today'      => (float) (clone $base)->whereBetween('created_at', [today(), today()->endOfDay()])->sum('total'),
        ];
    }
}
