<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePaymentGatewayRequest;
use App\Http\Resources\Admin\PaymentGatewayResource;
use App\Models\PaymentGateway;
use App\Repositories\Contracts\PaymentGatewayRepositoryInterface;
use Illuminate\Http\JsonResponse;

class PaymentGatewayController extends Controller
{
    public function __construct(private readonly PaymentGatewayRepositoryInterface $gateways) {}

    public function index(): JsonResponse
    {
        return $this->success(PaymentGatewayResource::collection($this->gateways->allOrdered()));
    }

    public function update(UpdatePaymentGatewayRequest $request, PaymentGateway $gateway): JsonResponse
    {
        $updated = $this->gateways->update($gateway, $request->validated());

        return $this->success(new PaymentGatewayResource($updated), 'Gateway updated.');
    }

    public function toggle(PaymentGateway $gateway): JsonResponse
    {
        $updated = $this->gateways->toggle($gateway);

        $message = $updated->is_active ? 'Gateway activated.' : 'Gateway deactivated.';

        return $this->success(new PaymentGatewayResource($updated), $message);
    }
}
