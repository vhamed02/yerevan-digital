<?php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ApiExceptionHandler
{
    public function register(Exceptions $exceptions): void
    {
        $exceptions->render(fn(ValidationException $e, Request $request) => $this->validation($e));
        $exceptions->render(fn(ModelNotFoundException $e, Request $request) => $this->notFound());
        $exceptions->render(fn(AuthenticationException $e, Request $request) => $this->unauthenticated());
        $exceptions->render(fn(AuthorizationException $e, Request $request) => $this->forbidden());
        $exceptions->render(fn(HttpException $e, Request $request) => $this->httpError($e));
    }

    private function validation(ValidationException $e): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'errors'  => $e->errors(),
            'code'    => 422,
        ], 422);
    }

    private function notFound(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Resource not found.',
            'errors'  => [],
            'code'    => 404,
        ], 404);
    }

    private function unauthenticated(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Unauthenticated.',
            'errors'  => [],
            'code'    => 401,
        ], 401);
    }

    private function forbidden(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'This action is unauthorized.',
            'errors'  => [],
            'code'    => 403,
        ], 403);
    }

    private function httpError(HttpException $e): JsonResponse
    {
        $code    = $e->getStatusCode();
        $message = $e->getMessage() ?: 'HTTP Error.';

        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => [],
            'code'    => $code,
        ], $code);
    }
}
