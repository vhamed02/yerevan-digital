<?php

namespace App\Services\PaymentGateway\Gateways;

use App\Services\PaymentGateway\Contracts\PaymentGatewayInterface;
use App\Services\PaymentGateway\Contracts\SupportsPrecheck;
use App\Services\PaymentGateway\DTOs\PaymentInitiateResponse;
use App\Services\PaymentGateway\DTOs\PaymentRefundResponse;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\DTOs\PaymentVerifyResponse;
use App\Support\Money;
use Illuminate\Support\Str;

/**
 * Idram Payment System — merchant interface.
 *
 * Implemented from Idram's official "Idram Payment System merchant interface
 * description" PDF. Two payment surfaces, one shared back end:
 *
 *  - **Wallet (web)**: the buyer's browser POSTs a plain field form to
 *    `banking.idram.am/Payment/GetPayment`. There is **no signature on the
 *    request** — Idram authenticates the merchant by EDP_REC_ACCOUNT alone, and
 *    the SUCCESS_URL / FAIL_URL / RESULT_URL are fixed per merchant by Idram
 *    staff, not passed per payment. Sending invented EDP_CHECKSUM /
 *    EDP_SUCCESS_URL fields (as an earlier revision of this class did) is not
 *    part of the protocol.
 *  - **Bank card**: the same order rendered in an iframe from
 *    `money.idram.am/{lang}/ccepayMerchant.aspx` with the fields as a query
 *    string.
 *
 * Idram then POSTs to RESULT_URL **twice**:
 *  (a) `EDP_PRECHECK=YES` — "is this bill real?". Answer the literal `OK` or the
 *      customer is bounced to FAIL_URL and no money moves. This request carries
 *      **no checksum**, so it must never mutate anything (see {@see SupportsPrecheck}).
 *  (b) the payment confirmation, signed with
 *      md5(rec:amount:SECRET_KEY:bill:payer:trans_id:trans_date), compared
 *      case-insensitively.
 *
 * Amounts are decimal with a dot separator; the confirmation is documented as
 * `format-0.00`, so we send two decimals and compare numerically rather than as
 * strings.
 */
class IdramGateway implements PaymentGatewayInterface, SupportsPrecheck
{
    /** Wallet form target — the browser POSTs here. */
    private const WALLET_URL = 'https://banking.idram.am/Payment/GetPayment';

    /** VISA/MasterCard iframe, `%s` is the interface language segment. */
    private const CARD_IFRAME_URL = 'https://money.idram.am/%s/ccepayMerchant.aspx';

    public function getName(): string
    {
        return 'idram';
    }

    public function initiate(PaymentRequest $request): PaymentInitiateResponse
    {
        // Idram publishes no sandbox host — an unconfigured store falls back to
        // the platform's own simulated checkout instead.
        if ($request->sandbox || !$this->validateCredentials($request->credentials)) {
            return new PaymentInitiateResponse(
                success: true,
                redirectUrl: $request->sandboxUrl ?? url('/api/v1/store/payments/sandbox/pay?order_id=' . $request->orderId),
                paymentId: 'SANDBOX-' . Str::random(8),
                errorMessage: null,
            );
        }

        $recAccount = $this->recipientFromCredentials($request->credentials);
        $amount     = $this->formatAmount($request->amount);

        if (($request->options['method'] ?? 'wallet') === 'card') {
            $url = sprintf(self::CARD_IFRAME_URL, $this->language()) . '?' . http_build_query([
                'EDP_REC_ACCOUNT' => $recAccount,
                'EDP_AMOUNT'      => $amount,
                'EDP_BILL_NO'     => $request->orderId,
            ]);

            return new PaymentInitiateResponse(
                success: true,
                redirectUrl: $url,
                paymentId: null,
                errorMessage: null,
                mode: PaymentInitiateResponse::MODE_IFRAME,
            );
        }

        $params = [
            'EDP_LANGUAGE'    => $this->language(),
            'EDP_REC_ACCOUNT' => $recAccount,
            'EDP_DESCRIPTION' => $request->description,
            'EDP_AMOUNT'      => $amount,
            'EDP_BILL_NO'     => $request->orderId,
        ];

        // Optional: overrides the merchant-level fallback address Idram mails a
        // confirmation to when we fail to answer "OK" on the confirmation POST.
        if (!empty($request->credentials['email'])) {
            $params['EDP_EMAIL'] = $request->credentials['email'];
        }

        return new PaymentInitiateResponse(
            success: true,
            redirectUrl: self::WALLET_URL,
            paymentId: null,
            errorMessage: null,
            rawResponse: $params,
            mode: PaymentInitiateResponse::MODE_FORM,
        );
    }

    public function verify(array $callbackData, array $credentials = []): PaymentVerifyResponse
    {
        $secret     = $credentials['secret_key'] ?? null;
        $recAccount = $this->recipientFromCredentials($credentials);

        if (!$secret || !$recAccount) {
            return new PaymentVerifyResponse(
                success: false,
                status: 'failed',
                transactionId: null,
                amount: null,
                errorMessage: 'Missing credentials for verification',
            );
        }

        // The signature covers our own EDP_REC_ACCOUNT rather than the value in
        // the payload, so a callback naming a different merchant can never
        // produce a matching checksum.
        $expected = strtoupper(md5(implode(':', [
            $recAccount,
            $callbackData['EDP_AMOUNT']        ?? '',
            $secret,
            $callbackData['EDP_BILL_NO']       ?? '',
            $callbackData['EDP_PAYER_ACCOUNT'] ?? '',
            $callbackData['EDP_TRANS_ID']      ?? '',
            $callbackData['EDP_TRANS_DATE']    ?? '',
        ])));

        $provided = strtoupper((string) ($callbackData['EDP_CHECKSUM'] ?? ''));

        if (!hash_equals($expected, $provided)) {
            return new PaymentVerifyResponse(
                success: false,
                status: 'failed',
                transactionId: null,
                amount: null,
                errorMessage: 'Invalid checksum',
                rawResponse: $callbackData,
            );
        }

        return new PaymentVerifyResponse(
            success: true,
            status: 'paid',
            transactionId: $callbackData['EDP_TRANS_ID'] ?? null,
            amount: (float) ($callbackData['EDP_AMOUNT'] ?? 0),
            errorMessage: null,
            rawResponse: $callbackData,
        );
    }

    public function extractOrderReference(array $callbackData): ?string
    {
        $billNo = $callbackData['EDP_BILL_NO'] ?? null;

        return ($billNo === null || $billNo === '') ? null : (string) $billNo;
    }

    public function isPrecheck(array $callbackData): bool
    {
        return strtoupper((string) ($callbackData['EDP_PRECHECK'] ?? '')) === 'YES';
    }

    public function precheckRecipient(array $callbackData): ?string
    {
        $account = $callbackData['EDP_REC_ACCOUNT'] ?? null;

        return ($account === null || $account === '') ? null : (string) $account;
    }

    public function precheckAmount(array $callbackData): ?string
    {
        $amount = $callbackData['EDP_AMOUNT'] ?? null;

        return is_numeric($amount) ? Money::of($amount) : null;
    }

    public function recipientFromCredentials(array $credentials): ?string
    {
        // `rec_account` is the documented name. `edp_id` / `account_id` are the
        // two keys earlier revisions of this gateway and its seeder row used —
        // accepted so a store configured before the rewrite keeps working.
        foreach (['rec_account', 'edp_id', 'account_id'] as $key) {
            if (!empty($credentials[$key])) {
                return (string) $credentials[$key];
            }
        }

        return null;
    }

    public function refund(string $transactionId, float $amount): PaymentRefundResponse
    {
        return new PaymentRefundResponse(
            success: false,
            refundId: null,
            errorMessage: 'Idram refunds must be processed manually through the Idram merchant panel.',
        );
    }

    public function getRequiredFields(): array
    {
        return [
            ['key' => 'rec_account', 'label' => 'Idram ID (EDP_REC_ACCOUNT)', 'type' => 'text'],
            ['key' => 'secret_key',  'label' => 'Secret Key',                 'type' => 'password'],
        ];
    }

    public function validateCredentials(array $credentials): bool
    {
        return $this->recipientFromCredentials($credentials) !== null
            && !empty($credentials['secret_key']);
    }

    /** Idram's interface language codes are AM / RU / EN. */
    private function language(): string
    {
        return match (app()->getLocale()) {
            'hy'    => 'AM',
            'ru'    => 'RU',
            default => 'EN',
        };
    }

    private function formatAmount(float $amount): string
    {
        return number_format($amount, 2, '.', '');
    }
}
