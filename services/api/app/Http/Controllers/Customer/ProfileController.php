<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ProfileUpdateRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();

        $user->update(array_filter([
            'name'   => $request->validated('name'),
            'phone'  => $request->validated('phone'),
            'locale' => $request->validated('locale'),
        ], fn($value) => $value !== null));

        return $this->success(new UserResource($user->fresh()), 'Profile updated.');
    }
}
