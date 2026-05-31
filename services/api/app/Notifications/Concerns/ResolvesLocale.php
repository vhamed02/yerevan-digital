<?php

namespace App\Notifications\Concerns;

trait ResolvesLocale
{
    protected function resolveLocale(?string $preferred): string
    {
        $supported = config('app.supported_locales');

        return in_array($preferred, $supported, true) ? $preferred : config('app.locale');
    }
}
