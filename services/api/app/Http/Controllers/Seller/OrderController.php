<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->success([]);
    }

    public function show(string $order): JsonResponse
    {
        return $this->success([]);
    }

    public function update(Request $request, string $order): JsonResponse
    {
        return $this->success([]);
    }
}
