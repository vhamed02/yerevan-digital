<?php

namespace App\Repositories\Contracts;

interface ProductViewRepositoryInterface
{
    public function increment(int $productId): void;
}
