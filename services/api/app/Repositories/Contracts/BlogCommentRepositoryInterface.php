<?php

namespace App\Repositories\Contracts;

use App\Models\BlogComment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BlogCommentRepositoryInterface
{
    /** @return array<int, array<string, mixed>> plain arrays, safe to cache in Redis */
    public function approvedForPost(int $postId): array;

    public function adminPage(string $status, int $perPage, int $page): LengthAwarePaginator;

    public function approve(BlogComment $comment): void;

    public function delete(BlogComment $comment): void;

    public function existsRecentByEmailAndPost(int $postId, string $email): bool;

    public function create(array $data): BlogComment;
}
