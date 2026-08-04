<?php

namespace App\Services\PaymentGateway\Gateways;

use App\Services\PaymentGateway\Contracts\UnimplementedGateway;
use App\Services\PaymentGateway\DTOs\PaymentInitiateResponse;
use App\Services\PaymentGateway\DTOs\PaymentRefundResponse;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\DTOs\PaymentVerifyResponse;
use RuntimeException;

/** Placeholder only — see {@see UnimplementedGateway}. No Converse Bank docs yet. */
class ConverseBankGateway implements UnimplementedGateway
{
    public function getName(): string
    {
        // Must match the seeded payment_gateways.name, which is 'converse'.
        return 'converse';
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

    public function extractOrderReference(array $callbackData): ?string
    {
        return null;
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
