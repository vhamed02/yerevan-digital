<?php

namespace App\Support;

/**
 * The platform's own merchant credentials, used to collect commission invoices
 * from sellers. The mirror of a store's `store_payment_gateways` row, except
 * these live in config because there is exactly one platform.
 *
 * Emptiness is decided per required key rather than by filtering the whole
 * array: both gateways carry optional settings with non-empty defaults
 * (Telcell's `valid_days`, Idram's `email`), so a truthiness test on the array
 * as a whole would report an unconfigured account as live and send sellers to a
 * gateway that rejects them.
 */
final class PlatformGatewayCredentials
{
    private const GATEWAYS = [
        'idram' => [
            'config'   => 'idram.platform',
            'required' => ['rec_account', 'secret_key'],
        ],
        'telcell' => [
            'config'   => 'telcell.platform',
            'required' => ['issuer', 'shop_key'],
        ],
    ];

    public static function supports(string $gateway): bool
    {
        return isset(self::GATEWAYS[$gateway]);
    }

    /** Live credentials, or `[]` when the account isn't configured (→ sandbox). */
    public static function for(string $gateway): array
    {
        if (! self::configured($gateway)) {
            return [];
        }

        return array_filter((array) config(self::GATEWAYS[$gateway]['config']), fn ($v) => $v !== null && $v !== '');
    }

    public static function configured(string $gateway): bool
    {
        if (! self::supports($gateway)) {
            return false;
        }

        $values = (array) config(self::GATEWAYS[$gateway]['config']);

        foreach (self::GATEWAYS[$gateway]['required'] as $key) {
            if (empty($values[$key])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Gateways a seller may pay an invoice with. When no platform account is
     * configured at all, every gateway is offered and each falls back to the
     * internal sandbox flow — otherwise a dev environment would have no way to
     * exercise the invoice payment path.
     *
     * @return list<string>
     */
    public static function available(): array
    {
        $live = array_values(array_filter(array_keys(self::GATEWAYS), self::configured(...)));

        return $live ?: array_keys(self::GATEWAYS);
    }
}
