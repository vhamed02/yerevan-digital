<?php

namespace App\Http\Controllers;

use App\Enums\StoreStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class StatsController extends Controller
{
    public function index(): JsonResponse
    {
        $stats = Cache::remember('platform:stats', 3600, function () {
            return [
                'total_stores'   => Store::where('status', StoreStatus::Active)->count(),
                'total_products' => Product::where('status', 'active')->count(),
                'total_orders'   => Order::count(),
            ];
        });

        return $this->success($stats);
    }
}
