<?php

namespace App\Repositories\Eloquent;

use App\Models\BlogComment;
use App\Repositories\Contracts\BlogCommentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BlogCommentRepository implements BlogCommentRepositoryInterface
{
    public function approvedForPost(int $postId): array
    {
        return BlogComment::where('post_id', $postId)
            ->where('is_approved', true)
            ->latest()
            ->get(['id', 'author_name', 'body', 'created_at'])
            ->map(fn (BlogComment $c) => [
                'id'          => $c->id,
                'author_name' => $c->author_name,
                'body'        => $c->body,
                'created_at'  => $c->created_at->toIso8601String(),
            ])
            ->all();
    }

    public function adminPage(string $status, int $perPage, int $page): LengthAwarePaginator
    {
        return BlogComment::with('post:id,slug,title')
            ->when($status === 'pending',  fn ($q) => $q->where('is_approved', false))
            ->when($status === 'approved', fn ($q) => $q->where('is_approved', true))
            ->latest()
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function approve(BlogComment $comment): void
    {
        $comment->update(['is_approved' => true]);
    }

    public function delete(BlogComment $comment): void
    {
        $comment->delete();
    }

    public function existsRecentByEmailAndPost(int $postId, string $email): bool
    {
        return BlogComment::where('post_id', $postId)
            ->where('author_email', $email)
            ->where('created_at', '>=', now()->subDay())
            ->exists();
    }

    public function create(array $data): BlogComment
    {
        return BlogComment::create($data);
    }
}
