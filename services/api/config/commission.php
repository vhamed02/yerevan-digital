<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default commission rate
    |--------------------------------------------------------------------------
    |
    | Decimal fraction of the commission base charged to a store on each paid
    | order (0.05 = 5%). Resolution order, first match wins:
    |
    |   1. stores.commission_rate          (per-store override)
    |   2. 'commission_rate' platform setting (store_settings, store_id NULL)
    |   3. this value
    |
    | Kept as a string so it never round-trips through a float.
    |
    */

    'default_rate' => env('COMMISSION_DEFAULT_RATE', '0.05'),

];
