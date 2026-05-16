<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePageRequest;
use App\Models\Page;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    public function index(): JsonResponse
    {
        $pages = Page::orderBy('slug')->get(['id', 'slug', 'title', 'is_published', 'updated_at']);

        return $this->success($pages);
    }

    public function show(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->firstOrFail();

        return $this->success($page);
    }

    public function update(UpdatePageRequest $request, string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->firstOrFail();

        $page->update($request->validated());

        return $this->success($page, 'Page updated.');
    }
}
