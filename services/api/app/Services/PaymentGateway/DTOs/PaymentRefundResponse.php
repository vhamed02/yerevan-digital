<?php

namespace App\Services\PaymentGateway\DTOs;

readonly class PaymentRefundResponse
{
    public function __construct(
        public bool    $success,
        public ?string $refundId,
        public ?string $errorMessage,
        public array   $rawResponse = [],
    ) {}
}
