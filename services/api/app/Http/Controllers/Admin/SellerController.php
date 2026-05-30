<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSellerStatusRequest;
use App\Http\Resources\Admin\SellerDetailResource;
use App\Http\Resources\Admin\SellerResource;
use App\Notifications\StoreSuspendedNotification;
use App\Repositories\Contracts\AdminSellerRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class SellerController extends Controller
{
    public function __construct(private readonly AdminSellerRepositoryInterface $sellers) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'search']);
        $sellers = $this->sellers->paginate($filters);

        return $this->paginated(SellerResource::collection($sellers));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', Password::defaults()],
            'phone'    => ['sometimes', 'nullable', 'string', 'max:50'],
            'status'   => ['sometimes', 'in:active,pending'],
            'locale'   => ['sometimes', 'in:hy,en,ru'],
        ]);

        $seller = $this->sellers->create($data);

        return $this->success(new SellerResource($seller), 'Seller created.', 201);
    }

    public function show(int $seller): JsonResponse
    {
        $seller = $this->sellers->findWithDetails($seller);

        return $this->success(new SellerDetailResource($seller));
    }

    public function updateStatus(UpdateSellerStatusRequest $request, int $seller): JsonResponse
    {
        $status = $request->validated()['status'];
        $seller = $this->sellers->updateStatus($seller, $status);

        if ($status === UserStatus::Suspended->value && $seller->store) {
            $seller->notify(new StoreSuspendedNotification($seller->store));
        }

        return $this->success(new SellerDetailResource($seller), 'Seller status updated.');
    }

    public function updatePassword(Request $request, int $seller): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $this->sellers->updatePassword($seller, $data['password']);

        return $this->success(null, 'Password updated.');
    }

    public function destroy(int $seller): JsonResponse
    {
        $this->sellers->softDeleteWithStore($seller);

        return $this->success(null, 'Seller deleted.');
    }
}
