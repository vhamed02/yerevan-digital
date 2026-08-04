<?php

namespace App\Services\PaymentGateway\DTOs;

readonly class PaymentInitiateResponse
{
    /** Follow `redirectUrl` with a plain GET. */
    public const MODE_REDIRECT = 'redirect';

    /** POST `rawResponse` as form fields to `redirectUrl`. */
    public const MODE_FORM = 'form';

    /** Embed `redirectUrl` in an iframe and poll the order for completion. */
    public const MODE_IFRAME = 'iframe';

    public function __construct(
        public bool    $success,
        public ?string $redirectUrl,
        public ?string $paymentId,
        public ?string $errorMessage,
        public array   $rawResponse = [],
        public string  $mode = self::MODE_REDIRECT,
    ) {}
}
