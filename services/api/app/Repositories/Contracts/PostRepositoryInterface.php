<?php

namespace App\Repositories\Contracts;

use App\Models\Post;

interface PostRepositoryInterface
{
    public function adminPage(array $filters, int $perPage): array;

    public function findBySlug(string $slug): Post;

    public function create(array $data): Post;

    public function update(Post $post, array $data): Post;

    public function delete(Post $post): void;

    public function publishedPage(int $page, int $perPage): array;

    public function publishedBySlug(string $slug): ?array;
}
