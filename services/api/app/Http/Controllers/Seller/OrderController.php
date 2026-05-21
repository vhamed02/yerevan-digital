<?php

namespace App\Http\Controllers\Seller;

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
    private const ALLOWED_TRANSITIONS = [
        'pending'    => ['paid', 'processing', 'cancelled'],
        'paid'       => ['processing', 'cancelled'],
        'processing' => ['shipped', 'cancelled'],
        'shipped'    => ['delivered'],
        'delivered'  => [],
        'cancelled'  => [],
        'refunded'   => [],
    ];

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

        $order = $this->orders->findByStoreAndUuid($store->id, $uuid);
        $newStatus = $request->validated()['status'];
        $currentStatus = $order->status->value;
        $allowed = self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];

        if (!in_array($newStatus, $allowed, true)) {
            return $this->error(
                "Cannot transition order from '{$currentStatus}' to '{$newStatus}'.",
                422
            );
        }

        $timestamps = [
            'shipped'   => ['shipped_at' => now()],
            'delivered' => ['delivered_at' => now()],
        ];

        $this->orders->update($order, array_merge(['status' => $newStatus], $timestamps[$newStatus] ?? []));

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
