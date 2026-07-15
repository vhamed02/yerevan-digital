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

        $stats = array_merge($productStats, $orderStats);

        // Storefront views that turned into a paid order. Views are counted per
        // product, so this is a directional signal rather than session tracking.
        $stats['conversion_rate'] = $stats['total_views'] > 0
            ? round($stats['paid_orders'] / $stats['total_views'] * 100, 2)
            : 0.0;

        return $this->success([
            'stats'            => $stats,
            'revenue_chart'    => $this->orders->revenueChartByStore($store->id),
            'orders_by_status' => $this->orders->ordersByStatusByStore($store->id),
            'top_products'     => $this->orders->topProductsByStore($store->id, 5),
            'recent_orders'    => $this->orders->recentByStore($store->id, 5)
                ->map(fn($order) => (new OrderResource($order))->resolve())
                ->values()
                ->all(),
        ]);
    }
}
