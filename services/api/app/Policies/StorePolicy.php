<?php

namespace App\Policies;

use App\Models\Store;
use App\Models\User;

class StorePolicy
{
    public function view(User $user, Store $store): bool
    {
        return $store->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('seller');
    }

    public function update(User $user, Store $store): bool
    {
        return $store->user_id === $user->id;
    }

    public function delete(User $user, Store $store): bool
    {
        return $store->user_id === $user->id;
    }
}
