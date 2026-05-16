<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePageRequest;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug'    => ['required', 'string', 'max:100', 'unique:pages,slug', 'regex:/^[a-z0-9-]+$/'],
            'title'   => ['required', 'array'],
            'title.hy' => ['required', 'string', 'max:200'],
            'title.en' => ['required', 'string', 'max:200'],
        ]);

        $page = Page::create([
            'slug'         => $data['slug'],
            'title'        => $data['title'],
            'content'      => ['hy' => '', 'en' => ''],
            'is_published' => false,
        ]);

        return $this->success($page, 'Page created.', 201);
    }

    public function update(UpdatePageRequest $request, string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->firstOrFail();

        $page->update($request->validated());

        return $this->success($page, 'Page updated.');
    }

    public function destroy(string $slug): JsonResponse
    {
        $protected = ['about', 'contact', 'terms', 'privacy'];

        if (in_array($slug, $protected)) {
            return $this->error('Cannot delete a built-in page.', 422);
        }

        Page::where('slug', $slug)->firstOrFail()->delete();

        return $this->success(null, 'Page deleted.');
    }
}
