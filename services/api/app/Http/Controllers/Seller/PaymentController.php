<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->success([]);
    }

    public function show(string $payment): JsonResponse
    {
        return $this->success([]);
    }
}
