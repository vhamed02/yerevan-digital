<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Resources\Seller\OrderResource;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly OrderRepositoryInterface   $orders,
        private readonly ProductRepositoryInterface $products,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $productStats = $this->products->countStatsByStore($store->id);
        $orderStats   = $this->orders->statsByStore($store->id);

        return $this->success([
            'stats'            => array_merge($productStats, $orderStats),
            'revenue_chart'    => $this->orders->revenueChartByStore($store->id),
            'orders_by_status' => $this->orders->ordersByStatusByStore($store->id),
            'recent_orders'    => $this->orders->recentByStore($store->id, 5)
                ->map(fn($order) => (new OrderResource($order))->resolve())
                ->values()
                ->all(),
        ]);
    }
}
