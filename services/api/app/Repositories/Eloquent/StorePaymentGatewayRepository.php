<?php

namespace App\Repositories\Eloquent;

use App\Models\StorePaymentGateway;
use App\Repositories\Contracts\StorePaymentGatewayRepositoryInterface;

class StorePaymentGatewayRepository implements StorePaymentGatewayRepositoryInterface
{
    public function configure(int $storeId, int $gatewayId, array $data): StorePaymentGateway
    {
        return StorePaymentGateway::updateOrCreate(
            ['store_id' => $storeId, 'payment_gateway_id' => $gatewayId],
            [
                'is_enabled'  => $data['is_enabled'],
                'is_sandbox'  => $data['is_sandbox'],
                'credentials' => $data['credentials'],
            ]
        );
    }

    public function findByStoreAndGateway(int $storeId, int $gatewayId): StorePaymentGateway
    {
        return StorePaymentGateway::where('store_id', $storeId)
            ->where('payment_gateway_id', $gatewayId)
            ->firstOrFail();
    }

    public function toggle(StorePaymentGateway $record): StorePaymentGateway
    {
        $record->update(['is_enabled' => !$record->is_enabled]);
        return $record;
    }
}
