<?php

namespace App\Observers;

use App\Models\Post;
use Illuminate\Support\Facades\Cache;

class PostObserver
{
    public function saved(Post $post): void
    {
        $this->flush($post);
    }

    public function deleted(Post $post): void
    {
        $this->flush($post);
    }

    private function flush(Post $post): void
    {
        Cache::forget("blog:post:{$post->slug}");

        $originalSlug = $post->getOriginal('slug');
        if ($originalSlug && $originalSlug !== $post->slug) {
            Cache::forget("blog:post:{$originalSlug}");
        }

        if (Cache::has('blog:posts:ver')) {
            Cache::increment('blog:posts:ver');
        }
    }
}
