<?php

namespace App\Events;

class ProductViewed
{
    public function __construct(
        public readonly int    $productId,
        public readonly string $ip,
    ) {}
}
