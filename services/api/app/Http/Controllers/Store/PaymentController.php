<?php

namespace App\Http\Controllers\Store;

use App\Actions\HandlePaymentSuccessAction;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Transaction;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayRegistry       $registry,
        private readonly HandlePaymentSuccessAction    $handlePaymentSuccess,
    ) {}

    public function initiate(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'order_uuid'  => ['required', 'string'],
        ]);

        $store       = $request->attributes->get('currentStore');
        $gatewayKey  = $request->input('gateway_key') ?? $request->input('payment_method');
        $orderUuid   = $request->input('order_uuid');

        if (!$gatewayKey) {
            return $this->error('Payment gateway is required.', 422);
        }

        $order = Order::where('store_id', $store->id)
            ->where('uuid', $orderUuid)
            ->where('status', OrderStatus::Pending)
            ->where('payment_status', PaymentStatus::Pending)
            ->firstOrFail();

        $storeGateway = $store->paymentGateways()
            ->where('is_enabled', true)
            ->whereHas('gateway', fn($q) => $q->where('name', $gatewayKey)->where('is_active', true))
            ->with('gateway')
            ->first();

        if (!$storeGateway) {
            return $this->error('Payment gateway not available for this store.', 422);
        }

        $transaction = Transaction::create([
            'order_id'           => $order->id,
            'store_id'           => $store->id,
            'payment_gateway_id' => $storeGateway->payment_gateway_id,
            'amount'             => $order->total,
            'currency'           => $order->currency,
            'status'             => TransactionStatus::Pending,
            'initiated_at'       => now(),
        ]);

        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        $paymentRequest = new PaymentRequest(
            orderId: $order->uuid,
            orderNumber: $order->order_number,
            amount: (float) $order->total,
            currency: $order->currency,
            description: "Order {$order->order_number} — {$store->getTranslation('name', 'en')}",
            callbackUrl: url("/api/v1/store/{$slug}/payments/callback/{$gatewayKey}"),
            successUrl: "{$frontendUrl}/store/{$slug}/checkout/success?order={$order->uuid}",
            failureUrl: "{$frontendUrl}/store/{$slug}/checkout/failed?order={$order->uuid}",
            credentials: $storeGateway->credentials ?? [],
            sandbox: $storeGateway->is_sandbox,
            sandboxUrl: "{$frontendUrl}/store/{$slug}/checkout/sandbox?order_id={$order->uuid}",
        );

        $gateway  = $this->registry->get($gatewayKey);
        $response = $gateway->initiate($paymentRequest);

        if (!$response->success) {
            $transaction->update(['status' => TransactionStatus::Failed]);
            return $this->error($response->errorMessage ?? 'Payment initiation failed.', 422);
        }

        $transaction->update([
            'external_transaction_id' => $response->paymentId,
            'gateway_request'         => $paymentRequest->credentials ? [] : $response->rawResponse,
        ]);

        return $this->success([
            'redirect_url' => $response->redirectUrl,
            'form_params'  => $response->rawResponse ?: null,
            'transaction'  => $transaction->uuid,
        ]);
    }

    public function callback(Request $request, string $slug, string $gateway): Response|JsonResponse
    {
        $callbackData = $request->all();

        Log::channel('single')->info("Payment callback [{$gateway}]", ['data' => $callbackData]);

        if (!$this->registry->has($gateway)) {
            return $this->error('Unknown payment gateway.', 404);
        }

        $orderUuid = $callbackData['EDP_BILL_NO'] ?? null;

        if (!$orderUuid) {
            return $this->error('Missing order reference.', 422);
        }

        $transaction = Transaction::whereHas('order', fn($q) => $q->where('uuid', $orderUuid))
            ->where('status', TransactionStatus::Pending)
            ->latest()
            ->first();

        if (!$transaction) {
            $alreadyPaid = Order::where('uuid', $orderUuid)
                ->where('payment_status', PaymentStatus::Paid)
                ->exists();

            if ($alreadyPaid) {
                if ($gateway === 'idram') {
                    return response('OK', 200)->header('Content-Type', 'text/plain');
                }
                return $this->success(null, 'Payment already processed.');
            }

            return $this->error('Transaction not found.', 404);
        }

        $storeGateway = $transaction->store->paymentGateways()
            ->where('payment_gateway_id', $transaction->payment_gateway_id)
            ->first();

        $credentials = $storeGateway?->credentials ?? [];

        $gatewayInstance = $this->registry->get($gateway);
        $verifyResponse  = $gatewayInstance->verify($callbackData, $credentials);

        $transaction->update([
            'status'                  => $verifyResponse->success ? TransactionStatus::Success : TransactionStatus::Failed,
            'external_transaction_id' => $verifyResponse->transactionId,
            'gateway_response'        => $verifyResponse->rawResponse,
            'completed_at'            => now(),
        ]);

        if ($verifyResponse->success) {
            $this->handlePaymentSuccess->execute($transaction->order, $gateway);
        }

        if ($gateway === 'idram') {
            if (!$verifyResponse->success) {
                return response('FAIL', 400)->header('Content-Type', 'text/plain');
            }
            return response('OK', 200)->header('Content-Type', 'text/plain');
        }

        return $this->success(null, 'Payment processed.');
    }

    public function sandboxComplete(Request $request): JsonResponse
    {
        if (!config('app.sandbox_mode')) {
            return $this->error('Not available in production.', 403);
        }

        $orderUuid = $request->input('order_id');
        $success   = $request->input('outcome') === 'success';

        $transaction = Transaction::whereHas('order', fn($q) => $q->where('uuid', $orderUuid))
            ->where('status', TransactionStatus::Pending)
            ->latest()
            ->first();

        if (!$transaction) {
            return $this->error('Transaction not found.', 404);
        }

        $transaction->update([
            'status'                  => $success ? TransactionStatus::Success : TransactionStatus::Failed,
            'external_transaction_id' => 'SANDBOX-' . strtoupper(\Illuminate\Support\Str::random(8)),
            'completed_at'            => now(),
        ]);

        $order       = $transaction->order;
        $slug        = $order->store->slug;
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        if ($success) {
            $this->handlePaymentSuccess->execute($order, 'sandbox');

            return $this->success(['redirect' => "{$frontendUrl}/store/{$slug}/checkout/success?order={$order->uuid}"]);
        }

        return $this->success(['redirect' => "{$frontendUrl}/store/{$slug}/checkout/failed?order={$order->uuid}"]);
    }
}
