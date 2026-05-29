<?php

namespace App\Data;

readonly class CheckoutData
{
    public function __construct(
        public int     $storeId,
        public array   $items,
        public string  $customerName,
        public string  $customerEmail,
        public ?string $customerPhone,
        public array   $shippingAddress,
        public ?string $notes,
        public string  $paymentMethod,
    ) {}
}
