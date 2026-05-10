<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->success([]);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->success([], 'Created.', 201);
    }

    public function show(string $id): JsonResponse
    {
        return $this->success([]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return $this->success([]);
    }

    public function destroy(string $id): JsonResponse
    {
        return $this->success(null, 'Deleted.');
    }

    public function approve(string $id): JsonResponse
    {
        return $this->success(null, 'Store approved.');
    }

    public function suspend(string $id): JsonResponse
    {
        return $this->success(null, 'Store suspended.');
    }

    public function feature(string $id): JsonResponse
    {
        return $this->success(null, 'Store featured status updated.');
    }
}
