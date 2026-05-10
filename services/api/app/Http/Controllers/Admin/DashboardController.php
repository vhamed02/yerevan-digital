<?php

namespace App\Http\Controllers\Admin;

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
    public function stats(): JsonResponse
    {
        $data = Cache::tags(['admin:stats'])->remember('admin:dashboard:stats', 300, function () {
            $revenueTotal = Order::sum('total');
            $revenueThisMonth = Order::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total');

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

            $recentOrders = Order::with('store')
                ->latest()
                ->limit(10)
                ->get();

            return [
                'total_sellers'         => User::where('role', UserRole::Seller)->count(),
                'active_stores'         => Store::where('status', StoreStatus::Active)->count(),
                'pending_stores'        => Store::where('status', StoreStatus::Pending)->count(),
                'total_products'        => DB::table('products')->whereNull('deleted_at')->count(),
                'total_orders'          => Order::count(),
                'revenue_total'         => ['amount' => (float) $revenueTotal, 'currency' => 'AMD'],
                'revenue_this_month'    => ['amount' => (float) $revenueThisMonth, 'currency' => 'AMD'],
                'new_sellers_this_month' => User::where('role', UserRole::Seller)
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'orders_today'          => Order::whereDate('created_at', today())->count(),
                'top_stores'            => $topStores,
                'recent_orders'         => OrderResource::collection($recentOrders)->resolve(),
            ];
        });

        return $this->success($data);
    }
}
