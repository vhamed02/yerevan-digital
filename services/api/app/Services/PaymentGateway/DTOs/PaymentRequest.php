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
        /**
         * Gateway-specific switches that don't belong in the shared shape —
         * e.g. Idram's `method` ('wallet' vs the VISA/MasterCard iframe).
         */
        public array   $options = [],
    ) {}
}
