<?php

namespace App\Services;

use Intervention\Image\Laravel\Facades\Image;

class ImageService
{
    public function resize(string $sourcePath, int $width, int $height): string
    {
        return Image::read($sourcePath)->scale($width, $height)->toJpeg(85)->toString();
    }

    public function generateVariants(string $sourcePath, string $disk = 'public'): array
    {
        return [
            'original'  => $sourcePath,
            'thumbnail' => '',
            'medium'    => '',
            'large'     => '',
        ];
    }
}
