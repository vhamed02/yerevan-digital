<?php

namespace App\Http\Controllers;

use App\Http\Requests\Store\TrackOrderRequest;
use App\Http\Resources\Customer\OrderResource;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Http\JsonResponse;

class OrderTrackingController extends Controller
{
    public function __construct(private readonly OrderRepositoryInterface $orders) {}

    public function track(TrackOrderRequest $request): JsonResponse
    {
        $order = $this->orders->findByOrderNumberAndEmail(
            $request->validated('order_number'),
            $request->validated('email'),
        );

        if (!$order) {
            return $this->error('Order not found. Check the order number and email.', 404);
        }

        return $this->success(new OrderResource($order));
    }
}
