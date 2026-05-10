<?php

namespace App\Http\Middleware;

use App\Enums\StoreStatus;
use App\Models\Store;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ResolveStore
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->route('slug');

        $store = Cache::remember("store:slug:{$slug}", 600, fn() => Store::where('slug', $slug)->first());

        if (!$store) {
            abort(404, 'Store not found.');
        }

        if ($store->status === StoreStatus::Suspended) {
            abort(503, 'This store is temporarily unavailable.');
        }

        $request->attributes->set('currentStore', $store);

        return $next($request);
    }
}
