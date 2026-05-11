<?php

namespace App\Services\PaymentGateway;

use App\Services\PaymentGateway\Contracts\PaymentGatewayInterface;
use RuntimeException;

class PaymentGatewayRegistry
{
    private array $gateways = [];

    public function register(string $key, PaymentGatewayInterface $gateway): void
    {
        $this->gateways[$key] = $gateway;
    }

    public function get(string $key): PaymentGatewayInterface
    {
        if (!isset($this->gateways[$key])) {
            throw new RuntimeException("Payment gateway '{$key}' is not registered.");
        }

        return $this->gateways[$key];
    }

    public function all(): array
    {
        return $this->gateways;
    }

    public function has(string $key): bool
    {
        return isset($this->gateways[$key]);
    }
}
