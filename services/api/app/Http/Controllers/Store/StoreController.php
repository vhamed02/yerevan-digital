<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class StoreController extends Controller
{
    public function info(string $slug): JsonResponse
    {
        return $this->success([]);
    }

    public function categories(string $slug): JsonResponse
    {
        return $this->success([]);
    }
}
