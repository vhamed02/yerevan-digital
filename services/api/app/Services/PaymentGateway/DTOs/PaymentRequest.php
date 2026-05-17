<?php

namespace App\Services\PaymentGateway\DTOs;

readonly class PaymentRequest
{
    public function __construct(
        public string  $orderId,
        public string  $orderNumber,
        public float   $amount,
        public string  $currency,
        public string  $description,
        public string  $callbackUrl,
        public string  $successUrl,
        public string  $failureUrl,
        public array   $credentials,
        public bool    $sandbox,
        public ?string $sandboxUrl = null,
    ) {}
}
