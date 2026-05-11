<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\ConfigurePaymentGatewayRequest;
use App\Http\Resources\Seller\AvailableGatewayResource;
use App\Http\Resources\Seller\ConfiguredGatewayResource;
use App\Models\PaymentGateway;
use App\Models\StorePaymentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function available(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $configured = $store->paymentGateways->keyBy('payment_gateway_id');

        $gateways = PaymentGateway::active()
            ->orderBy('sort_order')
            ->get()
            ->map(function ($gateway) use ($configured) {
                $gateway->storeGateway = $configured->get($gateway->id);
                return $gateway;
            });

        return $this->success(AvailableGatewayResource::collection($gateways));
    }

    public function configured(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $gateways = $store->paymentGateways()->with('gateway')->get();

        return $this->success(ConfiguredGatewayResource::collection($gateways));
    }

    public function configure(ConfigurePaymentGatewayRequest $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (!$store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $data = $request->validated();
        $gateway = PaymentGateway::findOrFail($data['payment_gateway_id']);

        $requiredKeys = collect($gateway->required_fields)->pluck('key')->toArray();
        $providedKeys = array_keys($data['credentials']);
        $missing = array_diff($requiredKeys, $providedKeys);

        if (!empty($missing)) {
            return $this->error('Missing required credential fields: ' . implode(', ', $missing), 422);
        }

        $record = StorePaymentGateway::updateOrCreate(
            ['store_id' => $store->id, 'payment_gateway_id' => $data['payment_gateway_id']],
            [
                'is_enabled'  => $data['is_enabled'],
                'is_sandbox'  => $data['is_sandbox'],
                'credentials' => $data['credentials'],
            ]
        );

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

        $record = StorePaymentGateway::where('store_id', $store->id)
            ->where('payment_gateway_id', $gatewayId)
            ->firstOrFail();

        $record->update(['is_enabled' => !$record->is_enabled]);

        $message = $record->is_enabled ? 'Gateway enabled.' : 'Gateway disabled.';

        return $this->success(new ConfiguredGatewayResource($record->load('gateway')), $message);
    }
}
