<?php

namespace App\Services\PaymentGateway\DTOs;

readonly class PaymentInitiateResponse
{
    public function __construct(
        public bool    $success,
        public ?string $redirectUrl,
        public ?string $paymentId,
        public ?string $errorMessage,
        public array   $rawResponse = [],
    ) {}
}
