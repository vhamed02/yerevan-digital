<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->success([]);
    }
}
