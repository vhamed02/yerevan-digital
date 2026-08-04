<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePaymentGatewayRequest;
use App\Http\Resources\Admin\PaymentGatewayResource;
use App\Models\PaymentGateway;
use App\Repositories\Contracts\PaymentGatewayRepositoryInterface;
use App\Services\PaymentGateway\Contracts\UnimplementedGateway;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use Illuminate\Http\JsonResponse;

class PaymentGatewayController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayRepositoryInterface $gateways,
        private readonly PaymentGatewayRegistry            $registry,
    ) {}

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
        // Deactivating is always allowed; only switching a gateway *on* is
        // guarded. Activating a placeholder would put a payment method in front
        // of buyers that fails — or throws — the moment anyone selects it.
        if (! $gateway->is_active && ($reason = $this->blocksActivation($gateway))) {
            return $this->error($reason, 422);
        }

        $updated = $this->gateways->toggle($gateway);

        $message = $updated->is_active ? 'Gateway activated.' : 'Gateway deactivated.';

        return $this->success(new PaymentGatewayResource($updated), $message);
    }

    /** Why this gateway cannot go live, or null if it can. */
    private function blocksActivation(PaymentGateway $gateway): ?string
    {
        if (! $this->registry->has($gateway->name)) {
            return "No payment gateway is registered under the key '{$gateway->name}', so it cannot be activated.";
        }

        if ($this->registry->get($gateway->name) instanceof UnimplementedGateway) {
            return "{$gateway->name} is a placeholder with no working integration yet and cannot be activated.";
        }

        return null;
    }
}
