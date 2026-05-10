<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->success([]);
    }

    public function update(Request $request): JsonResponse
    {
        return $this->success([]);
    }
}
