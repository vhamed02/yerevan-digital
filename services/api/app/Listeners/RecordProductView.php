<?php

namespace App\Listeners;

use App\Events\ProductViewed;
use App\Repositories\Contracts\ProductViewRepositoryInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Cache;

class RecordProductView implements ShouldQueue
{
    public string $queue = 'default';

    public function __construct(private readonly ProductViewRepositoryInterface $views) {}

    public function handle(ProductViewed $event): void
    {
        $key  = 'pvw:' . $event->productId . ':' . hash('sha256', $event->ip);
        $isNew = Cache::add($key, 1, now()->addHours(12));

        if ($isNew) {
            $this->views->increment($event->productId);
        }
    }
}
