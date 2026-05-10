<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(string $slug): JsonResponse
    {
        return $this->success([]);
    }

    public function show(string $slug, string $productSlug): JsonResponse
    {
        return $this->success([]);
    }
}
