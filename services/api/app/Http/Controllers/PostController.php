<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\PostRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PostController extends Controller
{
    public function __construct(private readonly PostRepositoryInterface $posts) {}

    public function index(Request $request): JsonResponse
    {
        $page    = max(1, (int) $request->query('page', 1));
        $perPage = min(20, max(1, (int) $request->query('per_page', 9)));

        $version = Cache::rememberForever('blog:posts:ver', fn () => 1);

        $payload = Cache::remember(
            "blog:posts:v{$version}:p{$page}:pp{$perPage}",
            300,
            fn () => $this->posts->publishedPage($page, $perPage)
        );

        return $this->success($payload);
    }

    public function show(string $slug): JsonResponse
    {
        $payload = Cache::remember(
            "blog:post:{$slug}",
            600,
            fn () => $this->posts->publishedBySlug($slug)
        );

        if ($payload === null) {
            return $this->error('Post not found.', 404);
        }

        return $this->success($payload);
    }
}
