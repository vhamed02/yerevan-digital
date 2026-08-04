<?php

namespace App\Http\Controllers\Seller;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Seller\InvoiceResource;
use App\Models\CommissionInvoice;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use App\Support\PlatformGatewayCredentials;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionInvoiceController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayRegistry $registry,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (! $store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $invoices = CommissionInvoice::byStore($store->id)->latest('id')->paginate(20);

        return $this->paginated(InvoiceResource::collection($invoices));
    }

    public function show(Request $request, string $uuid): JsonResponse
    {
        return $this->success(new InvoiceResource($this->findOrFail($request, $uuid)));
    }

    /** Which platform merchant accounts a seller can settle an invoice through. */
    public function paymentMethods(): JsonResponse
    {
        return $this->success(PlatformGatewayCredentials::available());
    }

    public function pay(Request $request, string $uuid): JsonResponse
    {
        $invoice = $this->findOrFail($request, $uuid);

        if ($invoice->status !== InvoiceStatus::Pending) {
            return $this->error('Invoice is not payable.', 422);
        }

        // Telcell stays the default so an older client that posts no gateway
        // keeps working.
        $gatewayKey = $request->input('gateway', 'telcell');

        if (! in_array($gatewayKey, PlatformGatewayCredentials::available(), true)) {
            return $this->error('Unsupported payment gateway.', 422);
        }

        // Empty credentials fall the gateway back to the internal sandbox flow.
        $credentials = PlatformGatewayCredentials::for($gatewayKey);

        $paymentRequest = new PaymentRequest(
            orderId: $invoice->uuid,
            orderNumber: $invoice->uuid,
            amount: (float) $invoice->amount,
            currency: $invoice->currency,
            description: "Yerevan Digital commission {$invoice->period_start->toDateString()}",
            callbackUrl: url("/api/v1/invoices/callback/{$gatewayKey}"),
            successUrl: rtrim(config('app.frontend_url'), '/') . "/seller/invoices?paid={$invoice->uuid}",
            failureUrl: rtrim(config('app.frontend_url'), '/') . "/seller/invoices?failed={$invoice->uuid}",
            credentials: $credentials,
            sandbox: empty($credentials),
            sandboxUrl: rtrim(config('app.frontend_url'), '/') . "/seller/invoices?sandbox={$invoice->uuid}",
        );

        $response = $this->registry->get($gatewayKey)->initiate($paymentRequest);

        return $this->success([
            'redirect_url' => $response->redirectUrl,
            'form_params'  => $response->rawResponse ?: null,
            'mode'         => $response->mode,
            'gateway'      => $gatewayKey,
            'invoice'      => $invoice->uuid,
        ]);
    }

    /** Always scoped by store, so one seller can never reach another's invoice. */
    private function findOrFail(Request $request, string $uuid): CommissionInvoice
    {
        $store = $request->attributes->get('sellerStore');

        abort_if(! $store, 404, 'You have not created a store yet.');

        return CommissionInvoice::byStore($store->id)->where('uuid', $uuid)->firstOrFail();
    }
}
