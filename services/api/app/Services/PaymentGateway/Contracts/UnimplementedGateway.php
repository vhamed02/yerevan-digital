<?php

namespace App\Services\PaymentGateway\Contracts;

/**
 * A placeholder gateway with no real protocol behind it.
 *
 * `InnecobankGateway` and `ConverseBankGateway` have been stubs since the very
 * first payment commit — every method either reports "coming soon" or throws.
 * They exist to reserve a name, not to take money.
 *
 * Marking them makes that explicit to code rather than only to a reader: the
 * admin panel refuses to activate a gateway carrying this marker, so a stray
 * toggle can't put a non-functioning payment method in front of buyers.
 *
 * Remove the marker as part of implementing the real protocol — and only with
 * the provider's own documentation in hand. Idram is the cautionary tale: it
 * was written from a written spec, looked complete, passed its own tests, and
 * could never have completed a payment.
 */
interface UnimplementedGateway extends PaymentGatewayInterface
{
}
