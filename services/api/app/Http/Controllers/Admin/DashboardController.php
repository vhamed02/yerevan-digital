<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\OrderResource;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $data = Cache::tags(['admin:stats'])->remember('admin:dashboard', 300, function () {
            $ordersToday     = Order::whereDate('created_at', today())->count();
            $ordersYesterday = Order::whereDate('created_at', today()->subDay())->count();
            $ordersChangePct = $ordersYesterday > 0
                ? (int) round(($ordersToday - $ordersYesterday) / $ordersYesterday * 100)
                : 0;

            $revenueThisMonth = (float) Order::whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('total');
            $revenueLastMonth = (float) Order::whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])->sum('total');
            $revenueChangePct = $revenueLastMonth > 0
                ? (int) round(($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth * 100)
                : 0;

            $ordersChart = Order::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->whereBetween('created_at', [now()->subDays(29)->startOfDay(), now()->endOfDay()])
                ->groupByRaw('DATE(created_at)')
                ->orderBy('date')
                ->get()
                ->map(fn($row) => ['date' => $row->date, 'count' => (int) $row->count])
                ->values();

            $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->get()
                ->map(fn($row) => ['status' => $row->status->value, 'count' => (int) $row->count])
                ->values();

            $pendingStores = Store::where('status', StoreStatus::Pending)
                ->with('owner')
                ->latest()
                ->limit(20)
                ->get()
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

            $recentOrders = Order::with('store')
                ->latest()
                ->limit(10)
                ->get()
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
                    'total_sellers'      => User::where('role', UserRole::Seller)->count(),
                    'sellers_this_month' => User::where('role', UserRole::Seller)
                        ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                        ->count(),
                    'active_stores'      => Store::where('status', StoreStatus::Active)->count(),
                    'stores_this_month'  => Store::whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->count(),
                    'orders_today'       => $ordersToday,
                    'orders_change_pct'  => $ordersChangePct,
                    'revenue_this_month' => $revenueThisMonth,
                    'revenue_change_pct' => $revenueChangePct,
                ],
                'orders_chart'     => $ordersChart,
                'orders_by_status' => $ordersByStatus,
                'pending_stores'   => $pendingStores,
                'recent_orders'    => $recentOrders,
            ];
        });

        return $this->success($data);
    }

    public function stats(): JsonResponse
    {
        $data = Cache::tags(['admin:stats'])->remember('admin:dashboard:stats', 300, function () {
            $revenueTotal     = Order::sum('total');
            $revenueThisMonth = Order::whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('total');

            $topStores = Store::withCount('orders')
                ->withSum('orders', 'total')
                ->where('status', StoreStatus::Active)
                ->orderByDesc('orders_count')
                ->limit(5)
                ->get()
                ->map(fn($store) => [
                    'slug'        => $store->slug,
                    'name'        => $store->getTranslations('name'),
                    'order_count' => $store->orders_count,
                    'revenue'     => $store->orders_sum_total ?? 0,
                ]);

            $recentOrders = Order::with('store')->latest()->limit(10)->get();

            return [
                'total_sellers'          => User::where('role', UserRole::Seller)->count(),
                'active_stores'          => Store::where('status', StoreStatus::Active)->count(),
                'pending_stores'         => Store::where('status', StoreStatus::Pending)->count(),
                'total_products'         => DB::table('products')->whereNull('deleted_at')->count(),
                'total_orders'           => Order::count(),
                'revenue_total'          => ['amount' => (float) $revenueTotal, 'currency' => 'AMD'],
                'revenue_this_month'     => ['amount' => (float) $revenueThisMonth, 'currency' => 'AMD'],
                'new_sellers_this_month' => User::where('role', UserRole::Seller)
                    ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                    ->count(),
                'orders_today'           => Order::whereDate('created_at', today())->count(),
                'top_stores'             => $topStores,
                'recent_orders'          => OrderResource::collection($recentOrders)->resolve(),
            ];
        });

        return $this->success($data);
    }
}
