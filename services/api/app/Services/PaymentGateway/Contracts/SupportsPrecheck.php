<?php

namespace App\Services\PaymentGateway\Contracts;

/**
 * A gateway that sends a *preliminary* authenticity request before moving money.
 *
 * Idram POSTs twice to RESULT_URL: first to ask "is this bill real?", and only
 * after we answer "OK" does it debit the customer and POST the real payment
 * confirmation. A gateway implementing this interface tells the callback
 * controller how to recognise that first request.
 *
 * The precheck carries **no checksum** — it must therefore never mutate state,
 * and must only ever confirm data the caller already supplied correctly.
 */
interface SupportsPrecheck extends PaymentGatewayInterface
{
    /** Is this raw callback payload the preliminary authenticity request? */
    public function isPrecheck(array $callbackData): bool;

    /**
     * The merchant account the precheck claims to be paying, so the controller
     * can reject a request aimed at a different merchant's account.
     */
    public function precheckRecipient(array $callbackData): ?string;

    /** The amount the precheck claims, as a decimal string, or null if absent. */
    public function precheckAmount(array $callbackData): ?string;

    /** The merchant account configured in a given credential set. */
    public function recipientFromCredentials(array $credentials): ?string;
}
