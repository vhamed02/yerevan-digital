<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Platform Idram merchant account
    |--------------------------------------------------------------------------
    |
    | Credentials for Yerevan Digital's own Idram merchant account, used to
    | collect weekly commission invoices from sellers (seller -> platform). This
    | is the opposite direction from checkout, where store_payment_gateways
    | holds each seller's own Idram credentials for customer -> seller payments.
    |
    | Leave these empty and invoice payment falls back to the internal sandbox
    | flow, exactly as an unconfigured store does at checkout.
    |
    | The three URLs Idram fixes per merchant must be registered with Idram for
    | this account (not per invoice):
    |   RESULT_URL  https://api.yerevan.digital/api/v1/invoices/callback/idram
    |   SUCCESS_URL https://yerevan.digital/seller/invoices?paid=1
    |   FAIL_URL    https://yerevan.digital/seller/invoices?failed=1
    |
    */

    'platform' => [
        'rec_account' => env('IDRAM_PLATFORM_REC_ACCOUNT'),
        'secret_key'  => env('IDRAM_PLATFORM_SECRET_KEY'),
        'email'       => env('IDRAM_PLATFORM_EMAIL'),
    ],

];
