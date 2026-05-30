<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED = ['hy', 'en', 'ru'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('Accept-Language', config('app.locale'));
        App::setLocale(in_array($locale, self::SUPPORTED) ? $locale : config('app.locale'));

        return $next($request);
    }
}
