<?php

namespace App\Http\Controllers\Seller;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\UpdateOrderStatusRequest;
use App\Http\Resources\Seller\OrderDetailResource;
use App\Http\Resources\Seller\OrderResource;
use App\Jobs\ExportOrdersJob;
use App\Notifications\OrderStatusChangedNotification;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function __construct(private readonly OrderRepositoryInterface $orders) {}

    public function index(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $paginator = $this->orders->paginateByStore($store->id, $request->only(['status', 'payment_status', 'date_from', 'date_to', 'search']));

        return $this->paginated(OrderResource::collection($paginator));
    }

    public function show(Request $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $order = $this->orders->findByStoreAndUuid($store->id, $uuid, ['items', 'transactions']);

        return $this->success(new OrderDetailResource($order));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $order     = $this->orders->findByStoreAndUuid($store->id, $uuid);
        $newStatus = OrderStatus::from($request->validated()['status']);

        if (!$order->status->canTransitionTo($newStatus)) {
            return $this->error(
                "Cannot transition order from '{$order->status->value}' to '{$newStatus->value}'.",
                422
            );
        }

        $extra = match($newStatus) {
            OrderStatus::Shipped   => ['shipped_at' => now()],
            OrderStatus::Delivered => ['delivered_at' => now()],
            default                => [],
        };

        $this->orders->update($order, array_merge(['status' => $newStatus], $extra));

        if ($order->customer) {
            $order->customer->notify(new OrderStatusChangedNotification($order));
        }

        return $this->success(new OrderResource($order->fresh()), 'Order status updated.');
    }

    public function export(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $filters = $request->only(['status', 'payment_status', 'date_from', 'date_to']);
        dispatch(new ExportOrdersJob($store->id, $request->user()->id, $filters));

        return $this->success(['job_id' => (string) Str::uuid()], 'Export queued. You will receive an email when ready.');
    }
}
