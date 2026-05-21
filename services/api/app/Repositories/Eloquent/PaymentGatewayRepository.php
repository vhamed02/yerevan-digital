<?php

namespace App\Repositories\Eloquent;

use App\Models\PaymentGateway;
use App\Repositories\Contracts\PaymentGatewayRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class PaymentGatewayRepository implements PaymentGatewayRepositoryInterface
{
    public function allOrdered(): Collection
    {
        return PaymentGateway::withCount([
            'storeGateways as store_gateways_count' => fn($q) => $q->where('is_enabled', true),
        ])
            ->orderBy('sort_order')
            ->get();
    }

    public function allActive(): Collection
    {
        return PaymentGateway::active()->orderBy('sort_order')->get();
    }

    public function findOrFail(int $id): PaymentGateway
    {
        return PaymentGateway::findOrFail($id);
    }

    public function update(PaymentGateway $gateway, array $data): PaymentGateway
    {
        $gateway->update($data);
        return $gateway->fresh();
    }

    public function toggle(PaymentGateway $gateway): PaymentGateway
    {
        $gateway->update(['is_active' => !$gateway->is_active]);
        return $gateway->fresh();
    }
}
