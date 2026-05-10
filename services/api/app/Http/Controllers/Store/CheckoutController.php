<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function checkout(Request $request, string $slug): JsonResponse
    {
        return $this->success([], 'Order created.', 201);
    }
}
