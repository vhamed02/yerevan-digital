<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\ConfigurePaymentGatewayRequest;
use App\Http\Resources\Seller\AvailableGatewayResource;
use App\Http\Resources\Seller\ConfiguredGatewayResource;
use App\Repositories\Contracts\PaymentGatewayRepositoryInterface;
use App\Repositories\Contracts\StorePaymentGatewayRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayRepositoryInterface      $gateways,
        private readonly StorePaymentGatewayRepositoryInterface $storeGateways,
    ) {}

    public function available(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $configured = $store->paymentGateways->keyBy('payment_gateway_id');

        $all = $this->gateways->allActive()->map(function ($gateway) use ($configured) {
            $gateway->storeGateway = $configured->get($gateway->id);
            return $gateway;
        });

        return $this->success(AvailableGatewayResource::collection($all));
    }

    public function configured(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $records = $store->paymentGateways()->with('gateway')->get();

        return $this->success(ConfiguredGatewayResource::collection($records));
    }

    public function configure(ConfigurePaymentGatewayRequest $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $data = $request->validated();
        $gateway = $this->gateways->findOrFail($data['payment_gateway_id']);

        $requiredKeys = collect($gateway->required_fields)->pluck('key')->toArray();
        $providedKeys = array_keys($data['credentials']);
        $missing = array_diff($requiredKeys, $providedKeys);

        if (!empty($missing)) {
            return $this->error('Missing required credential fields: ' . implode(', ', $missing), 422);
        }

        $record = $this->storeGateways->configure($store->id, $data['payment_gateway_id'], $data);

        return $this->success(
            new ConfiguredGatewayResource($record->load('gateway')),
            'Payment gateway configured.'
        );
    }

    public function toggle(Request $request, int $gatewayId): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $record = $this->storeGateways->findByStoreAndGateway($store->id, $gatewayId);
        $this->storeGateways->toggle($record);

        $message = $record->is_enabled ? 'Gateway enabled.' : 'Gateway disabled.';

        return $this->success(new ConfiguredGatewayResource($record->load('gateway')), $message);
    }
}
