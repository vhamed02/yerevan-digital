<?php

namespace App\Repositories\Contracts;

use App\Models\PaymentGateway;
use Illuminate\Database\Eloquent\Collection;

interface PaymentGatewayRepositoryInterface
{
    public function allOrdered(): Collection;

    public function allActive(): Collection;

    public function findOrFail(int $id): PaymentGateway;

    public function update(PaymentGateway $gateway, array $data): PaymentGateway;

    public function toggle(PaymentGateway $gateway): PaymentGateway;
}
