<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\Laravel\Facades\Image;
use InvalidArgumentException;

class ImageService
{
    private string $disk = 'public';

    private const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    private const MAX_BYTES      = 20 * 1024 * 1024;

    public function process(UploadedFile $file, string $category = 'misc', ?string $storeId = null): array
    {
        if (!in_array($file->getMimeType(), self::ALLOWED_MIMES, true)) {
            throw new InvalidArgumentException('Unsupported image type: ' . $file->getMimeType());
        }

        if ($file->getSize() > self::MAX_BYTES) {
            throw new InvalidArgumentException('Image exceeds the maximum allowed size of 20MB.');
        }

        $uuid   = Str::uuid()->toString();
        $folder = $this->buildPath($category, $storeId, $uuid);

        Storage::disk($this->disk)->makeDirectory($folder);

        $originalPath = $folder . 'original.webp';
        $thumbPath    = $folder . 'thumbnail.webp';
        $mediumPath   = $folder . 'medium.webp';
        $largePath    = $folder . 'large.webp';

        Image::decode($file)
            ->encode(new WebpEncoder(quality: 90))
            ->save(Storage::disk($this->disk)->path($originalPath));

        Image::decode($file)
            ->cover(150, 150)
            ->encode(new WebpEncoder(quality: 85))
            ->save(Storage::disk($this->disk)->path($thumbPath));

        Image::decode($file)
            ->scaleDown(600, 600)
            ->encode(new WebpEncoder(quality: 85))
            ->save(Storage::disk($this->disk)->path($mediumPath));

        Image::decode($file)
            ->scaleDown(1200, 1200)
            ->encode(new WebpEncoder(quality: 88))
            ->save(Storage::disk($this->disk)->path($largePath));

        $dimensions = Image::decode($file);

        return [
            'uuid'      => $uuid,
            'original'  => Storage::disk($this->disk)->url($originalPath),
            'thumbnail' => Storage::disk($this->disk)->url($thumbPath),
            'medium'    => Storage::disk($this->disk)->url($mediumPath),
            'large'     => Storage::disk($this->disk)->url($largePath),
            'width'     => $dimensions->width(),
            'height'    => $dimensions->height(),
            'size'      => $file->getSize(),
            'mime'      => 'image/webp',
        ];
    }

    public function delete(string $uuid, string $category = 'misc', ?string $storeId = null): void
    {
        $folder = $this->buildPath($category, $storeId, $uuid);
        Storage::disk($this->disk)->deleteDirectory($folder);
    }

    private function buildPath(string $category, ?string $storeId, string $uuid): string
    {
        return $storeId
            ? "images/{$category}/{$storeId}/{$uuid}/"
            : "images/{$category}/{$uuid}/";
    }
}
