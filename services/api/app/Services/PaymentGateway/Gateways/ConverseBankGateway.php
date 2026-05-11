<?php

namespace App\Services\PaymentGateway\Gateways;

use App\Services\PaymentGateway\Contracts\PaymentGatewayInterface;
use App\Services\PaymentGateway\DTOs\PaymentInitiateResponse;
use App\Services\PaymentGateway\DTOs\PaymentRefundResponse;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\DTOs\PaymentVerifyResponse;
use RuntimeException;

class ConverseBankGateway implements PaymentGatewayInterface
{
    public function getName(): string
    {
        return 'converse_bank';
    }

    public function initiate(PaymentRequest $request): PaymentInitiateResponse
    {
        return new PaymentInitiateResponse(
            success: false,
            redirectUrl: null,
            paymentId: null,
            errorMessage: 'Converse Bank integration coming soon',
        );
    }

    public function verify(array $callbackData, array $credentials = []): PaymentVerifyResponse
    {
        return new PaymentVerifyResponse(
            success: false,
            status: 'failed',
            transactionId: null,
            amount: null,
            errorMessage: 'Not implemented',
        );
    }

    public function refund(string $transactionId, float $amount): PaymentRefundResponse
    {
        throw new RuntimeException('Not implemented');
    }

    public function getRequiredFields(): array
    {
        throw new RuntimeException('Not implemented');
    }

    public function validateCredentials(array $credentials): bool
    {
        throw new RuntimeException('Not implemented');
    }
}
