<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use App\Models\CommissionInvoice;
use App\Services\PaymentGateway\Gateways\TelcellGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvoicePaymentController extends Controller
{
    public function callback(Request $request): Response|JsonResponse
    {
        $data = $request->all();

        Log::channel('single')->info('Invoice callback [telcell]', ['data' => $data]);

        $gateway = new TelcellGateway();
        $uuid    = $gateway->extractOrderReference($data);

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
                return response('OK', 200)->header('Content-Type', 'text/plain');
            }

            return $this->error('Invoice not found.', 404);
        }

        $verify = $gateway->verify($data, array_filter(config('telcell.platform')));

        if ($verify->success) {
            DB::transaction(fn () => $invoice->update([
                'status'              => InvoiceStatus::Paid,
                'paid_at'             => now(),
                'payment_reference'   => $data['payment_id'] ?? null,
                'external_invoice_id' => $data['invoice'] ?? null,
            ]));
        }

        // Only an untrusted request (bad signature) is rejected. A correctly
        // signed REJECTED is a legitimate notification — acknowledge it so
        // Telcell does not keep retrying.
        if (! $verify->success && $verify->status === 'failed') {
            return response('Invalid checksum', 400)->header('Content-Type', 'text/plain');
        }

        return response('OK', 200)->header('Content-Type', 'text/plain');
    }
}
