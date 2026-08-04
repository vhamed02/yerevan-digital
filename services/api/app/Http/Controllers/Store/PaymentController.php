<?php

namespace App\Http\Controllers\Store;

use App\Actions\HandlePaymentSuccessAction;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Transaction;
use App\Services\PaymentGateway\Contracts\SupportsPrecheck;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use App\Support\Money;
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

        $store     = $request->attributes->get('currentStore');
        $orderUuid = $request->input('order_uuid');

        [$gatewayKey, $gatewayOptions] = $this->resolveGateway(
            $request->input('gateway_key') ?? $request->input('payment_method')
        );

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
            description: "Order {$order->order_number} — " . ($store->getTranslation('name', app()->getLocale()) ?: $store->getTranslation('name', 'en') ?: $store->getTranslation('name', 'hy')),
            callbackUrl: url("/api/v1/store/{$slug}/payments/callback/{$gatewayKey}"),
            successUrl: "{$frontendUrl}/store/{$slug}/checkout/success?order={$order->uuid}",
            failureUrl: "{$frontendUrl}/store/{$slug}/checkout/failed?order={$order->uuid}",
            credentials: $storeGateway->credentials ?? [],
            sandbox: $storeGateway->is_sandbox,
            sandboxUrl: "{$frontendUrl}/store/{$slug}/checkout/sandbox?order_id={$order->uuid}",
            options: $gatewayOptions,
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
            'mode'         => $response->mode,
            'transaction'  => $transaction->uuid,
        ]);
    }

    /**
     * Map a checkout payment_method onto a registered gateway key plus any
     * gateway-specific switches. Idram exposes two surfaces (wallet form and
     * card iframe) that share one gateway, one credential set and one callback.
     *
     * @return array{0: ?string, 1: array}
     */
    private function resolveGateway(?string $requested): array
    {
        return match ($requested) {
            'idram_card' => ['idram', ['method' => 'card']],
            default      => [$requested, []],
        };
    }

    public function callback(Request $request, string $slug, string $gateway): Response|JsonResponse
    {
        $callbackData = $request->all();

        Log::channel('single')->info("Payment callback [{$gateway}]", ['data' => $callbackData]);

        if (!$this->registry->has($gateway)) {
            return $this->error('Unknown payment gateway.', 404);
        }

        $gatewayInstance = $this->registry->get($gateway);

        if ($gatewayInstance instanceof SupportsPrecheck && $gatewayInstance->isPrecheck($callbackData)) {
            return $this->handlePrecheck($request, $gatewayInstance, $callbackData);
        }

        $orderUuid = $gatewayInstance->extractOrderReference($callbackData);

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
                if (in_array($gateway, ['idram', 'telcell'], true)) {
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

        $verifyResponse = $gatewayInstance->verify($callbackData, $credentials);

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
                return response('Invalid checksum', 400)->header('Content-Type', 'text/plain');
            }
            return response('OK', 200)->header('Content-Type', 'text/plain');
        }

        if ($gateway === 'telcell') {
            // Only an untrusted request (bad signature) is rejected. A correctly
            // signed REJECTED is a legitimate notification — acknowledge it so
            // Telcell does not keep retrying.
            if (!$verifyResponse->success && $verifyResponse->status === 'failed') {
                return response('Invalid checksum', 400)->header('Content-Type', 'text/plain');
            }
            return response('OK', 200)->header('Content-Type', 'text/plain');
        }

        return $this->success(null, 'Payment processed.');
    }

    /**
     * Answer a gateway's preliminary "is this bill real?" request.
     *
     * Idram sends this *before* debiting the customer and it carries **no
     * checksum**, so this path is strictly read-only: it confirms facts the
     * caller already supplied and never touches the order, the transaction or
     * the ledger. Anything less than a full match answers with a non-`OK` body,
     * which makes Idram abandon the payment and bounce the customer to FAIL_URL.
     *
     * Enumeration is contained by EDP_BILL_NO being the order UUID — an
     * unauthenticated caller cannot guess a bill number to probe.
     */
    private function handlePrecheck(Request $request, SupportsPrecheck $gateway, array $callbackData): Response
    {
        $store     = $request->attributes->get('currentStore');
        $orderUuid = $gateway->extractOrderReference($callbackData);

        $reject = fn(string $reason) => tap(
            response('', 200)->header('Content-Type', 'text/plain'),
            fn() => Log::channel('single')->warning('Payment precheck rejected', [
                'gateway' => $gateway->getName(),
                'store'   => $store?->slug,
                'order'   => $orderUuid,
                'reason'  => $reason,
            ])
        );

        if (!$store || !$orderUuid) {
            return $reject('missing store or bill number');
        }

        $order = Order::where('store_id', $store->id)
            ->where('uuid', $orderUuid)
            ->where('status', OrderStatus::Pending)
            ->where('payment_status', PaymentStatus::Pending)
            ->first();

        if (!$order) {
            return $reject('no pending order for this bill number');
        }

        $storeGateway = $store->paymentGateways()
            ->where('is_enabled', true)
            ->whereHas('gateway', fn($q) => $q->where('name', $gateway->getName())->where('is_active', true))
            ->first();

        if (!$storeGateway) {
            return $reject('gateway not enabled for this store');
        }

        $expectedAccount = $gateway->recipientFromCredentials($storeGateway->credentials ?? []);
        $claimedAccount  = $gateway->precheckRecipient($callbackData);

        if (!$expectedAccount || $expectedAccount !== $claimedAccount) {
            return $reject('recipient account mismatch');
        }

        $claimedAmount = $gateway->precheckAmount($callbackData);

        if ($claimedAmount === null || Money::compare(Money::of($order->total), $claimedAmount) !== 0) {
            return $reject('amount mismatch');
        }

        return response('OK', 200)->header('Content-Type', 'text/plain');
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
