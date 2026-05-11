<?php

namespace App\Services\PaymentGateway\DTOs;

readonly class PaymentVerifyResponse
{
    public function __construct(
        public bool    $success,
        public string  $status,
        public ?string $transactionId,
        public ?float  $amount,
        public ?string $errorMessage,
        public array   $rawResponse = [],
    ) {}
}
