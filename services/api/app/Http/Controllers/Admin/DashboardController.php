<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\OrderResource;
use App\Repositories\Contracts\AdminSellerRepositoryInterface;
use App\Repositories\Contracts\AdminStoreRepositoryInterface;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(
        private readonly OrderRepositoryInterface         $orders,
        private readonly AdminStoreRepositoryInterface    $stores,
        private readonly AdminSellerRepositoryInterface   $sellers,
    ) {}

    public function dashboard(): JsonResponse
    {
        $data = Cache::tags(['admin:stats'])->remember('admin:dashboard', 300, function () {
            $ordersToday     = $this->orders->countToday();
            $ordersYesterday = $this->orders->countYesterday();
            $ordersChangePct = $ordersYesterday > 0
                ? (int) round(($ordersToday - $ordersYesterday) / $ordersYesterday * 100)
                : 0;

            $revenueThisMonth = $this->orders->revenueBetween(now()->startOfMonth(), now()->endOfMonth());
            $revenueLastMonth = $this->orders->revenueBetween(now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth());
            $revenueChangePct = $revenueLastMonth > 0
                ? (int) round(($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth * 100)
                : 0;

            $pendingStores = $this->stores->pendingWithOwner(20)
                ->map(fn($store) => [
                    'id'                  => $store->id,
                    'slug'                => $store->slug,
                    'name'                => $store->getTranslations('name'),
                    'status'              => $store->status->value,
                    'is_featured'         => $store->is_featured,
                    'product_count'       => 0,
                    'order_count'         => 0,
                    'revenue'             => 0,
                    'payment_gateways'    => [],
                    'created_at'          => $store->created_at?->toIso8601String(),
                    'registered_days_ago' => (int) ($store->created_at?->diffInDays(now()) ?? 0),
                    'seller'              => $store->owner ? [
                        'id'    => $store->owner->id,
                        'name'  => $store->owner->name,
                        'email' => $store->owner->email,
                    ] : null,
                ])
                ->values();

            $recentOrders = $this->orders->recentWithStore(10)
                ->map(fn($order) => [
                    'uuid'          => $order->uuid,
                    'order_number'  => $order->order_number,
                    'store_name'    => $order->store?->getTranslation('name', 'hy')
                        ?? $order->store?->getTranslation('name', 'en')
                        ?? '—',
                    'customer_name' => $order->customer_name,
                    'amount'        => (float) $order->total,
                    'status'        => $order->status->value,
                    'created_at'    => $order->created_at?->toIso8601String(),
                ])
                ->values();

            return [
                'stats' => [
                    'total_sellers'      => $this->sellers->countTotal(),
                    'sellers_this_month' => $this->sellers->countBetween(now()->startOfMonth(), now()->endOfMonth()),
                    'active_stores'      => $this->stores->countActive(),
                    'stores_this_month'  => $this->stores->countBetween(now()->startOfMonth(), now()->endOfMonth()),
                    'orders_today'       => $ordersToday,
                    'orders_change_pct'  => $ordersChangePct,
                    'revenue_this_month' => $revenueThisMonth,
                    'revenue_change_pct' => $revenueChangePct,
                ],
                'orders_chart'     => $this->orders->chartLast30Days(),
                'orders_by_status' => $this->orders->countsByStatus(),
                'pending_stores'   => $pendingStores,
                'recent_orders'    => $recentOrders,
            ];
        });

        return $this->success($data);
    }

    public function stats(): JsonResponse
    {
        $data = Cache::tags(['admin:stats'])->remember('admin:dashboard:stats', 300, function () {
            $topStores = $this->stores->topByRevenue(5)
                ->map(fn($store) => [
                    'slug'        => $store->slug,
                    'name'        => $store->getTranslations('name'),
                    'order_count' => $store->orders_count,
                    'revenue'     => $store->orders_sum_total ?? 0,
                ]);

            $recentOrders = $this->orders->recentWithStore(10);

            return [
                'total_sellers'          => $this->sellers->countTotal(),
                'active_stores'          => $this->stores->countActive(),
                'pending_stores'         => $this->stores->countPending(),
                'total_products'         => DB::table('products')->whereNull('deleted_at')->count(),
                'total_orders'           => $this->orders->countAll(),
                'revenue_total'          => ['amount' => $this->orders->revenueTotal(), 'currency' => 'AMD'],
                'revenue_this_month'     => ['amount' => $this->orders->revenueBetween(now()->startOfMonth(), now()->endOfMonth()), 'currency' => 'AMD'],
                'new_sellers_this_month' => $this->sellers->countBetween(now()->startOfMonth(), now()->endOfMonth()),
                'orders_today'           => $this->orders->countToday(),
                'top_stores'             => $topStores,
                'recent_orders'          => OrderResource::collection($recentOrders)->resolve(),
            ];
        });

        return $this->success($data);
    }
}
