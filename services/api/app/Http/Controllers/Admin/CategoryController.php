<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderCategoryRequest;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Resources\Admin\CategoryResource;
use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function __construct(private readonly CategoryRepositoryInterface $categories) {}

    public function index(): JsonResponse
    {
        return $this->success(CategoryResource::collection($this->categories->treeWithProductCounts()));
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']['en']);
        }

        $category = $this->categories->create($data);

        return $this->success(new CategoryResource($category), 'Category created.', 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']['en']);
        }

        $updated = $this->categories->update($category, $data);

        return $this->success(new CategoryResource($updated->fresh('children')), 'Category updated.');
    }

    public function destroy(Category $category): JsonResponse
    {
        $hasActiveProducts = $category->products()->whereNull('deleted_at')->exists();

        if ($hasActiveProducts) {
            return $this->error('Cannot delete category with active products.', 422);
        }

        $this->categories->delete($category);

        return $this->success(null, 'Category deleted.');
    }

    public function sort(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order'   => ['required', 'array'],
            'order.*' => ['integer', 'exists:categories,id'],
        ]);

        $this->categories->reorder($data['order']);

        return $this->success(null, 'Categories sorted.');
    }

    public function reorder(ReorderCategoryRequest $request, Category $category): JsonResponse
    {
        $this->categories->reorder($request->validated()['order']);

        $category->load('children');

        return $this->success(new CategoryResource($category), 'Children reordered.');
    }
}
