<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Platform Telcell merchant account
    |--------------------------------------------------------------------------
    |
    | Credentials for the platform's own Telcell wallet, used to collect weekly
    | commission invoices from sellers (seller -> platform), as opposed to
    | store_payment_gateways which holds each seller's own Telcell credentials
    | for customer -> seller checkout payments.
    |
    */

    'platform' => [
        'issuer'     => env('TELCELL_PLATFORM_ISSUER'),
        'shop_key'   => env('TELCELL_PLATFORM_SHOP_KEY'),
        'valid_days' => env('TELCELL_PLATFORM_VALID_DAYS', '3'),
    ],

];
