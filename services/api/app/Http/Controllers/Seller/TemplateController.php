<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function show(): JsonResponse
    {
        return $this->success([]);
    }

    public function update(Request $request): JsonResponse
    {
        return $this->success([]);
    }

    public function showConfig(): JsonResponse
    {
        return $this->success([]);
    }

    public function updateConfig(Request $request): JsonResponse
    {
        return $this->success([]);
    }
}
