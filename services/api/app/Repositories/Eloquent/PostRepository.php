<?php

namespace App\Repositories\Eloquent;

use App\Models\Post;
use App\Repositories\Contracts\PostRepositoryInterface;

class PostRepository implements PostRepositoryInterface
{
    public function adminPage(array $filters, int $perPage): array
    {
        $paginator = Post::query()
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['search'] ?? null, function ($q, $search): void {
                $q->where(fn ($w) => $w
                    ->where('slug', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%"));
            })
            ->orderByDesc('created_at')
            ->paginate($perPage, ['id', 'slug', 'title', 'status', 'author_name', 'published_at', 'updated_at']);

        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ];
    }

    public function findBySlug(string $slug): Post
    {
        return Post::where('slug', $slug)->firstOrFail();
    }

    public function create(array $data): Post
    {
        return Post::create($data);
    }

    public function update(Post $post, array $data): Post
    {
        $post->update($data);

        return $post;
    }

    public function delete(Post $post): void
    {
        $post->delete();
    }

    public function publishedPage(int $page, int $perPage): array
    {
        $paginator = Post::published()
            ->orderByDesc('published_at')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())->map(fn (Post $post) => [
                'slug'         => $post->slug,
                'title'        => $post->title,
                'excerpt'      => $post->excerpt,
                'cover'        => $post->cover,
                'author_name'  => $post->author_name,
                'published_at' => $post->published_at?->toIso8601String(),
            ])->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ];
    }

    public function publishedBySlug(string $slug): ?array
    {
        $post = Post::published()->where('slug', $slug)->first();

        if (!$post) {
            return null;
        }

        return [
            'slug'             => $post->slug,
            'title'            => $post->title,
            'excerpt'          => $post->excerpt,
            'content'          => $post->content,
            'cover'            => $post->cover,
            'author_name'      => $post->author_name,
            'published_at'     => $post->published_at?->toIso8601String(),
            'updated_at'       => $post->updated_at?->toIso8601String(),
            'meta_title'       => $post->meta_title,
            'meta_description' => $post->meta_description,
        ];
    }
}
