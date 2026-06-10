<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Requests\Admin\UpdatePostRequest;
use App\Repositories\Contracts\PostRepositoryInterface;
use App\Services\SlugService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function __construct(
        private readonly PostRepositoryInterface $posts,
        private readonly SlugService $slugService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', 'string', 'in:draft,published'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        return $this->success($this->posts->adminPage($filters, 20));
    }

    public function show(string $slug): JsonResponse
    {
        return $this->success($this->posts->findBySlug($slug));
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = $this->slugService->generateForPost($data['title']['en']);
        }

        $post = $this->posts->create($data);

        return $this->success($post, 'Post created.', 201);
    }

    public function update(UpdatePostRequest $request, string $slug): JsonResponse
    {
        $post = $this->posts->findBySlug($slug);
        $this->posts->update($post, $request->validated());

        return $this->success($post->fresh(), 'Post updated.');
    }

    public function destroy(string $slug): JsonResponse
    {
        $this->posts->delete($this->posts->findBySlug($slug));

        return $this->success(null, 'Post deleted.');
    }
}
