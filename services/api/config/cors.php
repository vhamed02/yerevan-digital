<?php

return [
    'paths'                    => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => [
        env('APP_URL', 'http://localhost'),
        env('NEXT_PUBLIC_APP_URL', 'http://localhost'),
        'http://localhost:3000',
        'https://vendora.am',
        'https://www.vendora.am',
    ],
    'allowed_origins_patterns' => [
        '#^https?://(.*\.)?vendora\.am$#',
        '#^https?://(.*\.)?radif\.org$#',
        '#^https?://(.*\.)?vendorex\.shop$#',
    ],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => true,
];
