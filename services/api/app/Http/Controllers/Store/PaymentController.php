<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function initiate(Request $request, string $slug): JsonResponse
    {
        return $this->success([]);
    }

    public function callback(Request $request, string $slug, string $gateway): JsonResponse
    {
        return $this->success(null, 'Payment processed.');
    }

    public function sandboxPay(string $slug): JsonResponse
    {
        return $this->success([], 'Sandbox payment page.');
    }
}
