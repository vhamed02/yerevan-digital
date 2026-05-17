<?php

namespace App\Http\Resources\Concerns;

trait ResolvesImageUrl
{
    protected function imageUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (str_starts_with($path, 'http')) {
            return $path;
        }

        return asset("storage/{$path}");
    }
}
