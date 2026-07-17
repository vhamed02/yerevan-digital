<?php

namespace App\Services\PaymentGateway\Contracts;

use App\Services\PaymentGateway\DTOs\PaymentInitiateResponse;
use App\Services\PaymentGateway\DTOs\PaymentRefundResponse;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\DTOs\PaymentVerifyResponse;

interface PaymentGatewayInterface
{
    public function getName(): string;

    public function initiate(PaymentRequest $request): PaymentInitiateResponse;

    public function verify(array $callbackData, array $credentials = []): PaymentVerifyResponse;

    /**
     * Pull the merchant-side order reference (our order UUID) out of a raw
     * gateway callback payload. Each gateway names and encodes this field
     * differently, so the controller can't hard-code it.
     */
    public function extractOrderReference(array $callbackData): ?string;

    public function refund(string $transactionId, float $amount): PaymentRefundResponse;

    public function getRequiredFields(): array;

    public function validateCredentials(array $credentials): bool;
}
