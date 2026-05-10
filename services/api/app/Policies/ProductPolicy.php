<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function view(User $user, Product $product): bool
    {
        return $product->store->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('seller');
    }

    public function update(User $user, Product $product): bool
    {
        return $product->store->user_id === $user->id;
    }

    public function delete(User $user, Product $product): bool
    {
        return $product->store->user_id === $user->id;
    }
}
