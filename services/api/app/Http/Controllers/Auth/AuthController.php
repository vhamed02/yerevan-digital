<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        return $this->success([], 'Created.', 201);
    }

    public function login(Request $request): JsonResponse
    {
        return $this->success([]);
    }

    public function logout(Request $request): JsonResponse
    {
        return $this->success(null, 'Logged out.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success($request->user());
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        return $this->success(null, 'Password reset link sent.');
    }

    public function resetPassword(Request $request): JsonResponse
    {
        return $this->success(null, 'Password reset successfully.');
    }
}
