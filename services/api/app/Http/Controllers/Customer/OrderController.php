<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\OrderResource;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private readonly OrderRepositoryInterface $orders) {}

    public function index(Request $request): JsonResponse
    {
        $orders = $this->orders->paginateByCustomer(
            $request->user()->id,
            $request->only(['status', 'payment_status'])
        );

        return $this->paginated(OrderResource::collection($orders));
    }

    public function show(Request $request, string $uuid): JsonResponse
    {
        $order = $this->orders->findByCustomerAndUuid(
            $request->user()->id,
            $uuid,
            ['items', 'store']
        );

        return $this->success(new OrderResource($order));
    }
}
