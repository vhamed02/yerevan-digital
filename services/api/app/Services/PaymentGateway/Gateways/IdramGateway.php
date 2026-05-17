<?php

namespace App\Services\PaymentGateway\Gateways;

use App\Services\PaymentGateway\Contracts\PaymentGatewayInterface;
use App\Services\PaymentGateway\DTOs\PaymentInitiateResponse;
use App\Services\PaymentGateway\DTOs\PaymentRefundResponse;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\DTOs\PaymentVerifyResponse;
use Illuminate\Support\Str;

class IdramGateway implements PaymentGatewayInterface
{
    private const LIVE_URL    = 'https://money.idram.am/payment/';
    private const SANDBOX_URL = 'https://sandbox.idram.am/payment/';

    public function getName(): string
    {
        return 'idram';
    }

    public function initiate(PaymentRequest $request): PaymentInitiateResponse
    {
        if ($request->sandbox || empty($request->credentials)) {
            $transactionUuid = (string) Str::uuid();

            return new PaymentInitiateResponse(
                success: true,
                redirectUrl: url('/api/v1/store/payments/sandbox/pay?transaction_id=' . $transactionUuid),
                paymentId: 'SANDBOX-' . Str::random(8),
                errorMessage: null,
            );
        }

        $edpId  = $request->credentials['edp_id'];
        $amount = number_format($request->amount, 2, '.', '');

        $checksum = strtoupper(md5(
            $request->credentials['secret_key'] . ':' .
            $edpId . ':' .
            $amount . ':' .
            $request->orderId
        ));

        $params = [
            'EDP_LANGUAGE'    => app()->getLocale() === 'hy' ? 'AM' : 'EN',
            'EDP_REC_ACCOUNT' => $edpId,
            'EDP_AMOUNT'      => $amount,
            'EDP_BILL_NO'     => $request->orderId,
            'EDP_DESCRIPTION' => $request->description,
            'EDP_SUCCESS_URL' => $request->successUrl,
            'EDP_FAILURE_URL' => $request->failureUrl,
            'EDP_CHECKSUM'    => $checksum,
        ];

        return new PaymentInitiateResponse(
            success: true,
            redirectUrl: self::LIVE_URL,
            paymentId: null,
            errorMessage: null,
            rawResponse: $params,
        );
    }

    public function verify(array $callbackData, array $credentials = []): PaymentVerifyResponse
    {
        if (empty($credentials)) {
            return new PaymentVerifyResponse(
                success: false,
                status: 'failed',
                transactionId: null,
                amount: null,
                errorMessage: 'Missing credentials for verification',
            );
        }

        $expected = strtoupper(md5(
            $credentials['secret_key'] . ':' .
            ($callbackData['EDP_REC_ACCOUNT'] ?? '') . ':' .
            ($callbackData['EDP_AMOUNT'] ?? '') . ':' .
            ($callbackData['EDP_BILL_NO'] ?? '') . ':' .
            ($callbackData['EDP_TRANS_ID'] ?? '')
        ));

        $provided = strtoupper($callbackData['EDP_CHECKSUM'] ?? '');

        if ($expected !== $provided) {
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
            transactionId: $callbackData['EDP_TRANS_ID'],
            amount: (float) $callbackData['EDP_AMOUNT'],
            errorMessage: null,
            rawResponse: $callbackData,
        );
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
            ['key' => 'edp_id', 'label' => 'EDP ID', 'type' => 'text'],
            ['key' => 'secret_key', 'label' => 'Secret Key', 'type' => 'password'],
        ];
    }

    public function validateCredentials(array $credentials): bool
    {
        return !empty($credentials['edp_id']) && !empty($credentials['secret_key']);
    }
}
