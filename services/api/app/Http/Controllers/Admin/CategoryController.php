<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderCategoryRequest;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Resources\Admin\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::withCount('products as product_count')
            ->with(['children' => fn($q) => $q->withCount('products as product_count')
                ->with(['children' => fn($q) => $q->withCount('products as product_count')])])
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get();

        return $this->success(CategoryResource::collection($categories));
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']['en']);
        }

        $category = Category::create($data);

        return $this->success(new CategoryResource($category), 'Category created.', 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']['en']);
        }

        $category->update($data);

        return $this->success(new CategoryResource($category->fresh('children')), 'Category updated.');
    }

    public function destroy(Category $category): JsonResponse
    {
        $hasActiveProducts = $category->products()->whereNull('deleted_at')->exists();

        if ($hasActiveProducts) {
            return $this->error('Cannot delete category with active products.', 422);
        }

        $category->delete();

        return $this->success(null, 'Category deleted.');
    }

    public function sort(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order'   => ['required', 'array'],
            'order.*' => ['integer', 'exists:categories,id'],
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['order'] as $position => $id) {
                Category::where('id', $id)->update(['sort_order' => $position]);
            }
        });

        return $this->success(null, 'Categories sorted.');
    }

    public function reorder(ReorderCategoryRequest $request, Category $category): JsonResponse
    {
        $order = $request->validated()['order'];

        DB::transaction(function () use ($order) {
            foreach ($order as $position => $id) {
                Category::where('id', $id)->update(['sort_order' => $position]);
            }
        });

        $category->load('children');

        return $this->success(new CategoryResource($category), 'Children reordered.');
    }
}
