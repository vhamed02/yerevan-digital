<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    public function index(string $uuid): JsonResponse
    {
        return $this->success([]);
    }

    public function store(Request $request, string $uuid): JsonResponse
    {
        return $this->success([], 'Created.', 201);
    }

    public function show(string $uuid, string $variant): JsonResponse
    {
        return $this->success([]);
    }

    public function update(Request $request, string $uuid, string $variant): JsonResponse
    {
        return $this->success([]);
    }

    public function destroy(string $uuid, string $variant): JsonResponse
    {
        return $this->success(null, 'Deleted.');
    }
}
