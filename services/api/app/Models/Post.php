<?php

namespace App\Models;

use App\Enums\PostStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'slug',
        'title',
        'excerpt',
        'content',
        'cover',
        'author_name',
        'status',
        'published_at',
        'meta_title',
        'meta_description',
    ];

    protected $casts = [
        'title'            => 'array',
        'excerpt'          => 'array',
        'content'          => 'array',
        'cover'            => 'array',
        'status'           => PostStatus::class,
        'published_at'     => 'datetime',
        'meta_title'       => 'array',
        'meta_description' => 'array',
    ];

    protected static function booted(): void
    {
        static::saving(function (Post $post): void {
            if ($post->status === PostStatus::Published && $post->published_at === null) {
                $post->published_at = now();
            }
        });
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', PostStatus::Published)
            ->where('published_at', '<=', now());
    }
}
