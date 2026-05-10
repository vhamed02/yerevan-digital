<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function show(): JsonResponse
    {
        return $this->success([]);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->success([], 'Created.', 201);
    }

    public function update(Request $request): JsonResponse
    {
        return $this->success([]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        return $this->success([], 'Logo uploaded.');
    }

    public function uploadBanner(Request $request): JsonResponse
    {
        return $this->success([], 'Banner uploaded.');
    }

    public function stats(): JsonResponse
    {
        return $this->success([]);
    }
}
