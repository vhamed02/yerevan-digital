<?php

namespace App\Http\Middleware;

use App\Enums\StoreStatus;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSeller
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user?->hasRole('seller')) {
            abort(403, 'Unauthorized.');
        }

        $store = $user->store()->first();

        if ($store) {
            if ($store->status === StoreStatus::Pending) {
                abort(403, 'Your store is awaiting admin approval.');
            }

            if ($store->status === StoreStatus::Suspended) {
                abort(403, 'Your store has been suspended. Contact support.');
            }
        }

        $request->attributes->set('sellerStore', $store);

        return $next($request);
    }
}
