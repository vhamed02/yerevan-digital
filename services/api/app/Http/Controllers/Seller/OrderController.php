<?php

namespace App\Http\Controllers\Seller;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\UpdateOrderStatusRequest;
use App\Http\Resources\Seller\OrderDetailResource;
use App\Http\Resources\Seller\OrderResource;
use App\Jobs\ExportOrdersJob;
use App\Models\Order;
use App\Notifications\OrderStatusChangedNotification;
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

    public function index(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $query = Order::where('store_id', $store->id)
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->payment_status, fn($q) => $q->where('payment_status', $request->payment_status))
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('order_number', 'like', "%{$request->search}%")
                    ->orWhere('customer_name', 'like', "%{$request->search}%");
            }))
            ->latest();

        return $this->paginated(OrderResource::collection($query->paginate(20)));
    }

    public function show(Request $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $order = Order::where('store_id', $store->id)
            ->where('uuid', $uuid)
            ->with(['items', 'transactions'])
            ->firstOrFail();

        return $this->success(new OrderDetailResource($order));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, string $uuid): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $order = Order::where('store_id', $store->id)->where('uuid', $uuid)->firstOrFail();
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

        $order->update(array_merge(['status' => $newStatus], $timestamps[$newStatus] ?? []));

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
