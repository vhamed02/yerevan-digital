<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\UpdatePasswordRequest;
use App\Http\Requests\Seller\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return $this->success(new UserResource($request->user()));
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $request->user()->update($request->validated());

        return $this->success(new UserResource($request->user()->fresh()));
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->error('Current password is incorrect.', 422);
        }

        $user->update(['password' => $request->password]);

        $currentTokenId = $user->currentAccessToken()?->id;
        $query          = $user->tokens();
        if ($currentTokenId) {
            $query->where('id', '!=', $currentTokenId);
        }
        $query->delete();

        return $this->success(null, 'Password updated successfully.');
    }
}
