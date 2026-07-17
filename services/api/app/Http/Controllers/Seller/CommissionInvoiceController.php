<?php

namespace App\Http\Controllers\Seller;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Seller\InvoiceResource;
use App\Models\CommissionInvoice;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\Gateways\TelcellGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionInvoiceController extends Controller
{
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

    public function pay(Request $request, string $uuid): JsonResponse
    {
        $invoice = $this->findOrFail($request, $uuid);

        if ($invoice->status !== InvoiceStatus::Pending) {
            return $this->error('Invoice is not payable.', 422);
        }

        // `valid_days` always has a truthy config default, so checking issuer/shop_key
        // specifically (not array_filter on the whole config) is what actually makes
        // "credentials unset" fall back to sandbox mode.
        $platform    = config('telcell.platform');
        $credentials = empty($platform['issuer']) || empty($platform['shop_key']) ? [] : $platform;

        $paymentRequest = new PaymentRequest(
            orderId: $invoice->uuid,
            orderNumber: $invoice->uuid,
            amount: (float) $invoice->amount,
            currency: $invoice->currency,
            description: "Vendora commission {$invoice->period_start->toDateString()}",
            callbackUrl: url('/api/v1/invoices/callback/telcell'),
            successUrl: rtrim(config('app.frontend_url'), '/') . "/seller/invoices?paid={$invoice->uuid}",
            failureUrl: rtrim(config('app.frontend_url'), '/') . "/seller/invoices?failed={$invoice->uuid}",
            credentials: $credentials,
            sandbox: empty($credentials),
            sandboxUrl: rtrim(config('app.frontend_url'), '/') . "/seller/invoices?sandbox={$invoice->uuid}",
        );

        $response = app(TelcellGateway::class)->initiate($paymentRequest);

        return $this->success([
            'redirect_url' => $response->redirectUrl,
            'form_params'  => $response->rawResponse ?: null,
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
