<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Custom storefront domains
    |--------------------------------------------------------------------------
    |
    | A seller points their own domain at the platform and it serves their
    | storefront. Ownership is proven with a TXT record before anything routes.
    |
    */

    // The platform's own host. Every store is served for free at
    // <slug>.<platform_host> (e.g. billing-test-store.yerevan.digital) without
    // any claim/verification — the platform owns the parent domain.
    'platform_host' => env('PLATFORM_HOST', 'yerevan.digital'),

    // Subdomain labels that must never be resolved to a store, even if a store
    // with that slug exists. These are platform-owned or ambiguous hostnames.
    'reserved_subdomains' => [
        'www', 'api', 'admin', 'app', 'mail', 'smtp', 'static', 'cdn',
        'assets', 'storage', 'media', 'files', 'ftp', 'ns', 'ns1', 'ns2',
    ],

    // TXT record checked for the verification token, prefixed to the domain:
    //   _yerevan-verify.shop.example.am  TXT  "<token>"
    'verification_prefix' => env('DOMAIN_VERIFY_PREFIX', '_yerevan-verify'),

    // Origin the seller points an A record at. TLS is terminated in front of us
    // (see docs/custom-domains.md), so this host only ever sees HTTP.
    'origin_ip' => env('DOMAIN_ORIGIN_IP', '51.68.174.251'),

    // Hosts that belong to the platform itself and can never be claimed by a
    // seller as a custom domain.
    'reserved' => [
        'yerevan.digital',
        'www.yerevan.digital',
        'api.yerevan.digital',
        'localhost',
    ],

    // How long a resolved host -> slug lookup is cached, in seconds. The proxy
    // hits this on every storefront request, so it must not be a live query.
    'resolve_cache_ttl' => env('DOMAIN_RESOLVE_TTL', 300),

];
