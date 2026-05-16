<?php

namespace App\Repositories\Eloquent;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Repositories\Contracts\AdminSellerRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

class AdminSellerRepository implements AdminSellerRepositoryInterface
{
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return User::query()
            ->where('role', UserRole::Seller)
            ->with(['store' => fn($q) => $q->withCount('orders')->withSum('orders', 'total')])
            ->when(isset($filters['status']), fn($q) => $q->where('status', $filters['status']))
            ->when(isset($filters['search']), fn($q) => $q->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('email', 'like', "%{$filters['search']}%");
            }))
            ->latest()
            ->paginate($perPage);
    }

    public function create(array $data): Model
    {
        return User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'phone'    => $data['phone'] ?? null,
            'password' => $data['password'],
            'role'     => UserRole::Seller,
            'status'   => $data['status'] ?? UserStatus::Active,
            'locale'   => $data['locale'] ?? 'hy',
        ]);
    }

    public function findWithDetails(int $id): Model
    {
        return User::where('role', UserRole::Seller)
            ->with(['store' => fn($q) => $q->withCount('orders')->withSum('orders', 'total')])
            ->findOrFail($id);
    }

    public function updateStatus(int $id, string $status): Model
    {
        $seller = User::where('role', UserRole::Seller)->findOrFail($id);
        $seller->update(['status' => $status]);
        return $seller->fresh(['store']);
    }

    public function softDeleteWithStore(int $id): void
    {
        $seller = User::where('role', UserRole::Seller)->findOrFail($id);
        $seller->store?->delete();
        $seller->delete();
    }
}
