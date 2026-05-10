<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->success([]);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->success([], 'Created.', 201);
    }

    public function show(string $uuid): JsonResponse
    {
        return $this->success([]);
    }

    public function update(Request $request, string $uuid): JsonResponse
    {
        return $this->success([]);
    }

    public function destroy(string $uuid): JsonResponse
    {
        return $this->success(null, 'Deleted.');
    }

    public function uploadImages(Request $request, string $uuid): JsonResponse
    {
        return $this->success([], 'Images uploaded.', 201);
    }

    public function reorderImages(Request $request, string $uuid): JsonResponse
    {
        return $this->success(null, 'Images reordered.');
    }

    public function deleteImage(string $uuid, string $id): JsonResponse
    {
        return $this->success(null, 'Image deleted.');
    }
}
