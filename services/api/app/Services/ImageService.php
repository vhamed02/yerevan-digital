<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    public function storeUpload(UploadedFile $file, string $context = 'general'): array
    {
        $uuid = (string) Str::uuid();
        $ext  = strtolower($file->getClientOriginalExtension()) ?: 'jpg';
        $dir  = "images/{$context}/{$uuid}";
        $name = "original.{$ext}";

        Storage::disk('public')->putFileAs($dir, $file, $name);

        $publicPath = '/storage/' . $dir . '/' . $name;

        return [
            'original'  => $publicPath,
            'thumbnail' => $publicPath,
            'medium'    => $publicPath,
            'large'     => $publicPath,
        ];
    }

    public function generateVariants(string $sourcePath, string $disk = 'public'): array
    {
        return [
            'original'  => $sourcePath,
            'thumbnail' => $sourcePath,
            'medium'    => $sourcePath,
            'large'     => $sourcePath,
        ];
    }
}
