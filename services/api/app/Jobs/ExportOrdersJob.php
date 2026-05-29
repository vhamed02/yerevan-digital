<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Notifications\OrdersExportedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class ExportOrdersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int $storeId,
        public readonly int $userId,
        public readonly array $filters = []
    ) {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $user  = User::find($this->userId);
        $store = Store::find($this->storeId);

        if (!$user || !$store) {
            return;
        }

        $orders = Order::where('store_id', $this->storeId)
            ->when($this->filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($this->filters['payment_status'] ?? null, fn($q, $v) => $q->where('payment_status', $v))
            ->when($this->filters['date_from'] ?? null, fn($q, $v) => $q->where('created_at', '>=', Carbon::parse($v)->startOfDay()))
            ->when($this->filters['date_to'] ?? null, fn($q, $v) => $q->where('created_at', '<=', Carbon::parse($v)->endOfDay()))
            ->latest()
            ->get();

        $user->notify(new OrdersExportedNotification(
            $this->buildCsv($orders),
            $store->getTranslation('name', 'en') ?: $store->getTranslation('name', 'hy')
        ));
    }

    private function buildCsv(Collection $orders): string
    {
        $handle = fopen('php://temp', 'r+');

        fputcsv($handle, [
            'Order #', 'Date', 'Status', 'Payment Status', 'Payment Method',
            'Customer Name', 'Customer Email', 'Customer Phone',
            'Subtotal', 'Discount', 'Shipping', 'Tax', 'Total', 'Currency',
        ]);

        foreach ($orders as $order) {
            fputcsv($handle, [
                $order->order_number,
                $order->created_at?->toDateTimeString(),
                $order->status->value,
                $order->payment_status->value,
                $order->payment_method ?? '',
                $order->customer_name,
                $order->customer_email,
                $order->customer_phone ?? '',
                number_format((float) $order->subtotal, 2, '.', ''),
                number_format((float) $order->discount, 2, '.', ''),
                number_format((float) $order->shipping_cost, 2, '.', ''),
                number_format((float) $order->tax, 2, '.', ''),
                number_format((float) $order->total, 2, '.', ''),
                $order->currency,
            ]);
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return (string) $content;
    }
}
