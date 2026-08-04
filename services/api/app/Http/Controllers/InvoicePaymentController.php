<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use App\Models\CommissionInvoice;
use App\Services\PaymentGateway\Contracts\SupportsPrecheck;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use App\Support\Money;
use App\Support\PlatformGatewayCredentials;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Commission invoice payment callbacks — seller paying the platform.
 *
 * Structurally a mirror of {@see \App\Http\Controllers\Store\PaymentController},
 * but the money flows the other way and the credentials come from config (the
 * platform's own merchant accounts) rather than from a store's
 * `store_payment_gateways` row.
 */
class InvoicePaymentController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayRegistry $registry,
    ) {}

    public function callback(Request $request, string $gateway = 'telcell'): Response|JsonResponse
    {
        $data = $request->all();

        Log::channel('single')->info("Invoice callback [{$gateway}]", ['data' => $data]);

        if (! PlatformGatewayCredentials::supports($gateway) || ! $this->registry->has($gateway)) {
            return $this->error('Unknown payment gateway.', 404);
        }

        $instance    = $this->registry->get($gateway);
        $credentials = PlatformGatewayCredentials::for($gateway);

        if ($instance instanceof SupportsPrecheck && $instance->isPrecheck($data)) {
            return $this->handlePrecheck($instance, $credentials, $data);
        }

        $uuid = $instance->extractOrderReference($data);

        if (! $uuid) {
            return $this->error('Missing invoice reference.', 422);
        }

        $invoice = CommissionInvoice::where('uuid', $uuid)
            ->where('status', InvoiceStatus::Pending)
            ->first();

        if (! $invoice) {
            $alreadyPaid = CommissionInvoice::where('uuid', $uuid)
                ->where('status', InvoiceStatus::Paid)
                ->exists();

            if ($alreadyPaid) {
                return $this->ok();
            }

            return $this->error('Invoice not found.', 404);
        }

        $verify = $instance->verify($data, $credentials);

        if ($verify->success) {
            DB::transaction(fn () => $invoice->update([
                'status'              => InvoiceStatus::Paid,
                'paid_at'             => now(),
                'payment_reference'   => $verify->transactionId,
                'external_invoice_id' => $data['invoice'] ?? null,
            ]));
        }

        // Only an untrusted request (bad signature) is rejected. A correctly
        // signed rejection is a legitimate notification — acknowledge it so the
        // gateway does not keep retrying.
        if (! $verify->success && $verify->status === 'failed') {
            return response('Invalid checksum', 400)->header('Content-Type', 'text/plain');
        }

        return $this->ok();
    }

    /**
     * Answer Idram's preliminary "is this bill real?" POST for an invoice.
     *
     * Unsigned, and therefore strictly read-only — see the equivalent method on
     * Store\PaymentController for the reasoning. Answering anything but `OK`
     * makes Idram abandon the payment rather than debit the seller.
     */
    private function handlePrecheck(SupportsPrecheck $gateway, array $credentials, array $data): Response
    {
        $uuid = $gateway->extractOrderReference($data);

        $reject = fn (string $reason) => tap(
            response('', 200)->header('Content-Type', 'text/plain'),
            fn () => Log::channel('single')->warning('Invoice precheck rejected', [
                'gateway' => $gateway->getName(),
                'invoice' => $uuid,
                'reason'  => $reason,
            ])
        );

        if (! $uuid) {
            return $reject('missing bill number');
        }

        $invoice = CommissionInvoice::where('uuid', $uuid)
            ->where('status', InvoiceStatus::Pending)
            ->first();

        if (! $invoice) {
            return $reject('no pending invoice for this bill number');
        }

        $expectedAccount = $gateway->recipientFromCredentials($credentials);

        if (! $expectedAccount || $expectedAccount !== $gateway->precheckRecipient($data)) {
            return $reject('recipient account mismatch');
        }

        $claimedAmount = $gateway->precheckAmount($data);

        if ($claimedAmount === null || Money::compare(Money::of($invoice->amount), $claimedAmount) !== 0) {
            return $reject('amount mismatch');
        }

        return $this->ok();
    }

    /** Both Idram and Telcell acknowledge with a bare plain-text OK. */
    private function ok(): Response
    {
        return response('OK', 200)->header('Content-Type', 'text/plain');
    }
}
