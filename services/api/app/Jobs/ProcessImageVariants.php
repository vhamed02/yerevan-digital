<?php

namespace App\Jobs;

use App\Services\ImageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ProcessImageVariants implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $sourcePath,
        public string $category,
        public ?string $storeId,
        public string $uuid,
    ) {}

    public function handle(ImageService $images): void
    {
        $disk = Storage::disk('public');

        $images->generate($disk->path($this->sourcePath), $this->category, $this->storeId, $this->uuid);

        $disk->delete($this->sourcePath);
    }
}
