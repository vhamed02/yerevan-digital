<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePageRequest;
use App\Models\Page;
use App\Repositories\Contracts\PageRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageController extends Controller
{
    public function __construct(private readonly PageRepositoryInterface $pages) {}

    public function index(): JsonResponse
    {
        return $this->success($this->pages->allOrdered());
    }

    public function show(string $slug): JsonResponse
    {
        return $this->success($this->pages->findBySlug($slug));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug'     => ['required', 'string', 'max:100', 'unique:pages,slug', 'regex:/^[a-z0-9-]+$/'],
            'title'    => ['required', 'array'],
            'title.hy' => ['required', 'string', 'max:200'],
            'title.en' => ['required', 'string', 'max:200'],
            'title.ru' => ['nullable', 'string', 'max:200'],
        ]);

        $page = $this->pages->create([
            'slug'         => $data['slug'],
            'title'        => $data['title'],
            'content'      => ['hy' => '', 'en' => ''],
            'is_published' => false,
        ]);

        return $this->success($page, 'Page created.', 201);
    }

    public function update(UpdatePageRequest $request, string $slug): JsonResponse
    {
        $page = $this->pages->findBySlug($slug);
        $this->pages->update($page, $request->validated());

        return $this->success($page, 'Page updated.');
    }

    public function destroy(string $slug): JsonResponse
    {
        $protected = ['about', 'contact', 'terms', 'privacy'];

        if (in_array($slug, $protected)) {
            return $this->error('Cannot delete a built-in page.', 422);
        }

        $this->pages->deleteBySlug($slug);

        return $this->success(null, 'Page deleted.');
    }
}
