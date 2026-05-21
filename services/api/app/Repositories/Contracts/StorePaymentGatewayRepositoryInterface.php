<?php

namespace App\Repositories\Contracts;

use App\Models\StorePaymentGateway;

interface StorePaymentGatewayRepositoryInterface
{
    public function configure(int $storeId, int $gatewayId, array $data): StorePaymentGateway;

    public function findByStoreAndGateway(int $storeId, int $gatewayId): StorePaymentGateway;

    public function toggle(StorePaymentGateway $record): StorePaymentGateway;
}
