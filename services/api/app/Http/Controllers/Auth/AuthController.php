<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\StoreSummaryResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Notifications\WelcomeSellerNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $request->password,
            'phone'    => $request->phone,
            'role'     => UserRole::Seller,
            'locale'   => 'hy',
        ]);

        $user->assignRole('seller');

        $token = $user->createToken('api')->plainTextToken;

        $user->notify(new WelcomeSellerNotification());

        return $this->success(
            $this->buildAuthResponse($user, $token),
            'Registration successful.',
            201
        );
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->error('Invalid credentials.', 401);
        }

        $user->updateQuietly(['last_login_at' => now()]);

        $token = $user->createToken('api')->plainTextToken;

        $store = $user->hasRole('seller') ? $user->store : null;

        return $this->success(
            $this->buildAuthResponse($user, $token, $store),
            'Logged in successfully.'
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        $user  = $request->user();
        $store = $user->hasRole('seller') ? $user->store : null;

        return $this->success([
            'user'  => new UserResource($user),
            'store' => $store ? new StoreSummaryResource($store) : null,
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            return $this->error(__($status), 400);
        }

        return $this->success(null, __($status));
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->error(__($status), 400);
        }

        return $this->success(null, __($status));
    }

    private function buildAuthResponse(User $user, string $token, mixed $store = null): array
    {
        return [
            'user'       => new UserResource($user),
            'store'      => $store ? new StoreSummaryResource($store) : null,
            'token'      => $token,
            'token_type' => 'Bearer',
        ];
    }
}
