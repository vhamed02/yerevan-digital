<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\PageRepositoryInterface;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    public function __construct(private readonly PageRepositoryInterface $pages) {}

    public function show(string $slug): JsonResponse
    {
        $page = $this->pages->findBySlug($slug);

        if (!$page->is_published) {
            return $this->error('Page not found.', 404);
        }

        return $this->success($page);
    }
}
