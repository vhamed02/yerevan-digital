<?php

namespace App\Services\PaymentGateway\Gateways;

use App\Services\PaymentGateway\Contracts\PaymentGatewayInterface;
use App\Services\PaymentGateway\DTOs\PaymentInitiateResponse;
use App\Services\PaymentGateway\DTOs\PaymentRefundResponse;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\DTOs\PaymentVerifyResponse;
use Illuminate\Support\Str;

/**
 * Telcell Wallet — WEB application integration.
 *
 * Docs: https://developer.telcell.am/integraciya-dlya-web-prilojeny/
 *
 * Flow: the buyer's browser POSTs an invoice form to telcellmoney.am/invoices
 * (we return the fields as `rawResponse`, the frontend auto-submits them).
 * Telcell then POSTs a signed result callback to our callback URL with a
 * PAID / REJECTED status. Both directions are signed with an MD5 of the
 * ordered fields prefixed by the merchant's secret `shop_key`.
 *
 * Amounts are whole Armenian Drams — AMD has no minor unit, and Telcell's
 * currency field is the literal dram sign "֏".
 */
class TelcellGateway implements PaymentGatewayInterface
{
    private const INVOICE_URL = 'https://telcellmoney.am/invoices';
    private const CURRENCY    = '֏';
    private const DEFAULT_VALID_DAYS = 1;

    public function getName(): string
    {
        return 'telcell';
    }

    public function initiate(PaymentRequest $request): PaymentInitiateResponse
    {
        // No live credentials → fall back to the shared internal sandbox flow,
        // matching how IdramGateway behaves for un-configured stores.
        if ($request->sandbox || empty($request->credentials)) {
            return new PaymentInitiateResponse(
                success: true,
                redirectUrl: $request->sandboxUrl ?? url('/api/v1/store/payments/sandbox/pay?order_id=' . $request->orderId),
                paymentId: 'SANDBOX-' . Str::random(8),
                errorMessage: null,
            );
        }

        $issuer    = $request->credentials['issuer'];
        $shopKey   = $request->credentials['shop_key'];
        $price     = (string) (int) round($request->amount);
        $product   = base64_encode($request->description);
        $issuerId  = base64_encode($request->orderId);
        $validDays = (string) ((int) ($request->credentials['valid_days'] ?? '') ?: self::DEFAULT_VALID_DAYS);

        // md5(shop_key + issuer + currency + price + product + issuer_id + valid_days)
        $securityCode = md5($shopKey . $issuer . self::CURRENCY . $price . $product . $issuerId . $validDays);

        $params = [
            'action'        => 'PostInvoice',
            'issuer'        => $issuer,
            'currency'      => self::CURRENCY,
            'price'         => $price,
            'product'       => $product,
            'issuer_id'     => $issuerId,
            'valid_days'    => $validDays,
            'lang'          => $this->mapLang(),
            'security_code' => $securityCode,
        ];

        return new PaymentInitiateResponse(
            success: true,
            redirectUrl: self::INVOICE_URL,
            paymentId: null,
            errorMessage: null,
            rawResponse: $params,
        );
    }

    public function verify(array $callbackData, array $credentials = []): PaymentVerifyResponse
    {
        if (empty($credentials['shop_key'])) {
            return new PaymentVerifyResponse(
                success: false,
                status: 'failed',
                transactionId: null,
                amount: null,
                errorMessage: 'Missing credentials for verification',
            );
        }

        // md5(shop_key + invoice + issuer_id + payment_id + currency + sum + time + status)
        $expected = md5(
            $credentials['shop_key'] .
            ($callbackData['invoice']    ?? '') .
            ($callbackData['issuer_id']  ?? '') .
            ($callbackData['payment_id'] ?? '') .
            ($callbackData['currency']   ?? '') .
            ($callbackData['sum']        ?? '') .
            ($callbackData['time']       ?? '') .
            ($callbackData['status']     ?? '')
        );

        $provided = strtolower($callbackData['checksum'] ?? '');

        if (!hash_equals($expected, $provided)) {
            // status 'failed' = untrusted request (bad/missing signature).
            return new PaymentVerifyResponse(
                success: false,
                status: 'failed',
                transactionId: null,
                amount: null,
                errorMessage: 'Invalid checksum',
                rawResponse: $callbackData,
            );
        }

        $amount        = isset($callbackData['sum']) ? (float) $callbackData['sum'] : null;
        $transactionId = $callbackData['payment_id'] ?? $callbackData['invoice'] ?? null;

        if (strtoupper($callbackData['status'] ?? '') !== 'PAID') {
            // Correctly-signed, but the buyer did not pay (e.g. REJECTED).
            // status 'rejected' = trusted notification, just not a success.
            return new PaymentVerifyResponse(
                success: false,
                status: 'rejected',
                transactionId: $transactionId,
                amount: $amount,
                errorMessage: 'Payment ' . strtolower($callbackData['status'] ?? 'not completed'),
                rawResponse: $callbackData,
            );
        }

        return new PaymentVerifyResponse(
            success: true,
            status: 'paid',
            transactionId: $transactionId,
            amount: $amount,
            errorMessage: null,
            rawResponse: $callbackData,
        );
    }

    public function extractOrderReference(array $callbackData): ?string
    {
        $issuerId = $callbackData['issuer_id'] ?? null;

        if (!$issuerId) {
            return null;
        }

        $decoded = base64_decode($issuerId, true);

        return ($decoded !== false && $decoded !== '') ? $decoded : null;
    }

    public function refund(string $transactionId, float $amount): PaymentRefundResponse
    {
        return new PaymentRefundResponse(
            success: false,
            refundId: null,
            errorMessage: 'Telcell refunds must be processed manually through the Telcell merchant panel.',
        );
    }

    public function getRequiredFields(): array
    {
        return [
            ['key' => 'issuer',     'label' => 'Shop Email (issuer)',      'type' => 'text'],
            ['key' => 'shop_key',   'label' => 'Shop Key',                 'type' => 'password'],
            ['key' => 'valid_days', 'label' => 'Invoice Validity (days)',  'type' => 'text'],
        ];
    }

    public function validateCredentials(array $credentials): bool
    {
        return !empty($credentials['issuer']) && !empty($credentials['shop_key']);
    }

    private function mapLang(): string
    {
        return match (app()->getLocale()) {
            'hy'    => 'hy',
            'ru'    => 'ru',
            default => 'en',
        };
    }
}
