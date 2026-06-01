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
        $this->guard($file);

        $uuid = Str::uuid()->toString();
        $this->generate($file->getRealPath(), $category, $storeId, $uuid);

        [$width, $height] = getimagesize($file->getRealPath());

        return array_merge($this->urls($category, $storeId, $uuid), [
            'uuid'   => $uuid,
            'width'  => $width,
            'height' => $height,
            'size'   => $file->getSize(),
            'mime'   => 'image/webp',
        ]);
    }

    public function prepare(UploadedFile $file, string $category = 'misc', ?string $storeId = null): array
    {
        $this->guard($file);

        $uuid   = Str::uuid()->toString();
        $folder = rtrim($this->buildPath($category, $storeId, $uuid), '/');
        $source = $file->storeAs($folder, 'source', $this->disk);

        return array_merge($this->urls($category, $storeId, $uuid), [
            'uuid'        => $uuid,
            'source_path' => $source,
        ]);
    }

    public function generate(string $sourcePath, string $category, ?string $storeId, string $uuid): void
    {
        $folder = $this->buildPath($category, $storeId, $uuid);
        Storage::disk($this->disk)->makeDirectory($folder);

        Image::decode($sourcePath)
            ->cover(150, 150)
            ->encode(new WebpEncoder(quality: 85))
            ->save(Storage::disk($this->disk)->path($folder . 'thumbnail.webp'));

        Image::decode($sourcePath)
            ->scaleDown(600, 600)
            ->encode(new WebpEncoder(quality: 85))
            ->save(Storage::disk($this->disk)->path($folder . 'medium.webp'));

        Image::decode($sourcePath)
            ->scaleDown(1200, 1200)
            ->encode(new WebpEncoder(quality: 88))
            ->save(Storage::disk($this->disk)->path($folder . 'large.webp'));
    }

    public function delete(string $uuid, string $category = 'misc', ?string $storeId = null): void
    {
        Storage::disk($this->disk)->deleteDirectory($this->buildPath($category, $storeId, $uuid));
    }

    private function urls(string $category, ?string $storeId, string $uuid): array
    {
        $folder = $this->buildPath($category, $storeId, $uuid);
        $large  = Storage::disk($this->disk)->url($folder . 'large.webp');

        return [
            'original'  => $large,
            'thumbnail' => Storage::disk($this->disk)->url($folder . 'thumbnail.webp'),
            'medium'    => Storage::disk($this->disk)->url($folder . 'medium.webp'),
            'large'     => $large,
        ];
    }

    private function guard(UploadedFile $file): void
    {
        if (!in_array($file->getMimeType(), self::ALLOWED_MIMES, true)) {
            throw new InvalidArgumentException('Unsupported image type: ' . $file->getMimeType());
        }

        if ($file->getSize() > self::MAX_BYTES) {
            throw new InvalidArgumentException('Image exceeds the maximum allowed size of 20MB.');
        }
    }

    private function buildPath(string $category, ?string $storeId, string $uuid): string
    {
        return $storeId
            ? "images/{$category}/{$storeId}/{$uuid}/"
            : "images/{$category}/{$uuid}/";
    }
}
