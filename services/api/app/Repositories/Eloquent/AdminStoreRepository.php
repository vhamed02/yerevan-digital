<?php

namespace App\Repositories\Eloquent;

use App\Enums\StoreStatus;
use App\Models\Store;
use App\Repositories\Contracts\AdminStoreRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

class AdminStoreRepository implements AdminStoreRepositoryInterface
{
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return Store::query()
            ->with('owner')
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->when(isset($filters['status']), fn($q) => $q->where('status', $filters['status']))
            ->when(isset($filters['featured']), fn($q) => $q->where('is_featured', (bool) $filters['featured']))
            ->when(isset($filters['search']), fn($q) => $q->where('slug', 'like', "%{$filters['search']}%"))
            ->latest()
            ->paginate($perPage);
    }

    public function create(array $data): Model
    {
        return Store::create([
            'user_id'             => $data['seller_id'],
            'name'                => $data['name'],
            'slug'                => $data['slug'],
            'status'              => $data['status'] ?? StoreStatus::Active,
            'active_template_key' => $data['active_template_key'] ?? 'minimal',
            'primary_color'       => $data['primary_color'] ?? '#6366F1',
            'currency'            => $data['currency'] ?? 'AMD',
            'description'         => $data['description'] ?? null,
        ]);
    }

    private function resolve(string $identifier): Store
    {
        $query = Store::query();
        return is_numeric($identifier)
            ? $query->findOrFail((int) $identifier)
            : $query->where('slug', $identifier)->firstOrFail();
    }

    public function findBySlugWithDetails(string $slug): Model
    {
        $store = $this->resolve($slug);
        return Store::with([
            'owner',
            'paymentGateways.gateway',
        ])
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->withCount('products')
            ->findOrFail($store->id);
    }

    public function approve(string $slug): Model
    {
        $store = $this->resolve($slug);
        $store->update(['status' => StoreStatus::Active]);
        return $store->fresh('owner');
    }

    public function suspend(string $slug, ?string $reason = null): Model
    {
        $store = $this->resolve($slug);
        $store->update(['status' => StoreStatus::Suspended]);
        return $store->fresh('owner');
    }

    public function toggleFeatured(string $slug): Model
    {
        $store = $this->resolve($slug);
        $store->update(['is_featured' => !$store->is_featured]);
        return $store->fresh();
    }

    public function softDelete(string $slug): void
    {
        $this->resolve($slug)->delete();
    }
}
