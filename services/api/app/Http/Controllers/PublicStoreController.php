<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class PublicStoreController extends Controller
{
    public function featured(): JsonResponse
    {
        return $this->success([]);
    }
}
