<?php

namespace App\Repositories\Eloquent;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Product;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

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

    public function paginateByCustomer(int $customerId, array $filters): LengthAwarePaginator
    {
        return Order::where('customer_id', $customerId)
            ->with('store')
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($filters['payment_status'] ?? null, fn($q, $v) => $q->where('payment_status', $v))
            ->latest()
            ->paginate(20);
    }

    public function findByCustomerAndUuid(int $customerId, string $uuid, array $with = []): Order
    {
        return Order::where('customer_id', $customerId)
            ->where('uuid', $uuid)
            ->with($with)
            ->firstOrFail();
    }

    public function findByOrderNumberAndEmail(string $orderNumber, string $email): ?Order
    {
        return Order::where('order_number', $orderNumber)
            ->whereRaw('LOWER(customer_email) = ?', [mb_strtolower($email)])
            ->with(['items', 'store'])
            ->first();
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
        // Revenue only ever counts paid, non-cancelled orders — a pending or
        // cancelled order is not money the seller made.
        $earning = fn () => Order::where('store_id', $storeId)->revenueCounted();

        $paidOrders  = $earning()->count();
        $paidRevenue = (float) $earning()->sum('total');

        return [
            'total_orders'        => (clone $base)->count(),
            'orders_this_month'   => (clone $base)->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->count(),
            'paid_orders'         => $paidOrders,
            'total_revenue'       => $paidRevenue,
            'revenue_this_month'  => (float) $earning()->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('total'),
            'revenue_today'       => (float) $earning()->whereBetween('created_at', [today(), today()->endOfDay()])->sum('total'),
            'average_order_value' => $paidOrders > 0 ? round($paidRevenue / $paidOrders, 2) : 0.0,
        ];
    }

    /**
     * Best sellers by revenue. Aggregates by product id only — grouping on the
     * translatable JSON name column is not portable — then resolves names in PHP.
     *
     * @return array<int, array{product_id: int, uuid: string|null, name: array, units: int, revenue: float}>
     */
    public function topProductsByStore(int $storeId, int $limit = 5): array
    {
        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.store_id', $storeId)
            ->whereNull('orders.deleted_at')
            ->where('orders.payment_status', PaymentStatus::Paid->value)
            ->whereNotIn('orders.status', [OrderStatus::Cancelled->value, OrderStatus::Refunded->value])
            ->groupBy('order_items.product_id')
            ->select('order_items.product_id')
            ->selectRaw('SUM(order_items.quantity) as units')
            ->selectRaw('SUM(order_items.total_price) as revenue')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get();

        $products = Product::whereIn('id', $rows->pluck('product_id'))
            ->get()
            ->keyBy('id');

        return $rows->map(function ($row) use ($products) {
            $product = $products->get($row->product_id);

            return [
                'product_id' => (int) $row->product_id,
                // Seller product routes key on uuid, not id.
                'uuid'       => $product?->uuid,
                // Plain arrays only — never hand an Eloquent model to the cache.
                'name'       => $product?->getTranslations('name') ?? ['hy' => '', 'en' => ''],
                'units'      => (int) $row->units,
                'revenue'    => (float) $row->revenue,
            ];
        })->values()->all();
    }

    public function revenueChartByStore(int $storeId): array
    {
        $rows = Order::where('store_id', $storeId)
            ->revenueCounted()
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
