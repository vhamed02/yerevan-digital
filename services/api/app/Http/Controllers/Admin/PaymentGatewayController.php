<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePaymentGatewayRequest;
use App\Http\Resources\Admin\PaymentGatewayResource;
use App\Models\PaymentGateway;
use Illuminate\Http\JsonResponse;

class PaymentGatewayController extends Controller
{
    public function index(): JsonResponse
    {
        $gateways = PaymentGateway::withCount([
            'storeGateways as store_gateways_count' => fn($q) => $q->where('is_enabled', true),
        ])
            ->orderBy('sort_order')
            ->get();

        return $this->success(PaymentGatewayResource::collection($gateways));
    }

    public function update(UpdatePaymentGatewayRequest $request, PaymentGateway $gateway): JsonResponse
    {
        $gateway->update($request->validated());

        return $this->success(new PaymentGatewayResource($gateway->fresh()), 'Gateway updated.');
    }

    public function toggle(PaymentGateway $gateway): JsonResponse
    {
        $gateway->update(['is_active' => !$gateway->is_active]);

        $message = $gateway->is_active ? 'Gateway activated.' : 'Gateway deactivated.';

        return $this->success(new PaymentGatewayResource($gateway->fresh()), $message);
    }
}
