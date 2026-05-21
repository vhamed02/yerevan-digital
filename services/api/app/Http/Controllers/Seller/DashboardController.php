<?php

namespace App\Http\Controllers\Seller;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Seller\OrderResource;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(private readonly OrderRepositoryInterface $orders) {}

    public function __invoke(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        return $this->success([
            'stats'            => $this->stats($store),
            'revenue_chart'    => $this->revenueChart($store),
            'orders_by_status' => $this->ordersByStatus($store),
            'recent_orders'    => $this->recentOrders($store),
        ]);
    }

    private function stats(object $store): array
    {
        $products = DB::table('products')
            ->where('store_id', $store->id)
            ->whereNull('deleted_at')
            ->selectRaw('COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active', [
                ProductStatus::Active->value,
            ])
            ->first();

        $base = DB::table('orders')->where('store_id', $store->id)->whereNull('deleted_at');

        $totalOrders = (clone $base)->count();

        $ordersThisMonth = (clone $base)
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();

        $revenueThisMonth = (clone $base)
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->sum('total');

        $revenueToday = (clone $base)
            ->whereDate('created_at', today())
            ->sum('total');

        return [
            'total_products'     => (int)   ($products->total ?? 0),
            'active_products'    => (int)   ($products->active ?? 0),
            'total_orders'       => $totalOrders,
            'orders_this_month'  => $ordersThisMonth,
            'revenue_this_month' => (float) $revenueThisMonth,
            'revenue_today'      => (float) $revenueToday,
        ];
    }

    private function revenueChart(object $store): array
    {
        $rows = DB::table('orders')
            ->where('store_id', $store->id)
            ->whereNull('deleted_at')
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->select('created_at', 'total')
            ->get()
            ->groupBy(fn($row) => substr($row->created_at, 0, 10));

        $chart = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $chart[] = [
                'date'    => $date,
                'revenue' => (float) ($rows->get($date)?->sum('total') ?? 0),
            ];
        }

        return $chart;
    }

    private function ordersByStatus(object $store): array
    {
        return DB::table('orders')
            ->where('store_id', $store->id)
            ->whereNull('deleted_at')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn($row) => ['status' => $row->status, 'count' => (int) $row->count])
            ->values()
            ->all();
    }

    private function recentOrders(object $store): array
    {
        return $this->orders->recentByStore($store->id, 5)
            ->map(fn($order) => (new OrderResource($order))->resolve())
            ->values()
            ->all();
    }
}
