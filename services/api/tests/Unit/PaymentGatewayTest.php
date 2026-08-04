<?php

namespace Tests\Unit;

use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\Gateways\ConverseBankGateway;
use App\Services\PaymentGateway\Gateways\IdramGateway;
use App\Services\PaymentGateway\Gateways\InnecobankGateway;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use RuntimeException;
use Tests\TestCase;

/**
 * Registry mechanics and the not-yet-implemented bank stubs.
 *
 * Idram lives in {@see IdramGatewayTest} and Telcell in {@see TelcellGatewayTest} —
 * a real protocol deserves its own file rather than a few cases wedged in here.
 */
class PaymentGatewayTest extends TestCase
{
    private function makePaymentRequest(): PaymentRequest
    {
        return new PaymentRequest(
            orderId: '550e8400-e29b-41d4-a716-446655440000',
            orderNumber: 'VEND-2026-00001',
            amount: 15000.00,
            currency: 'AMD',
            description: 'Test Order',
            callbackUrl: 'https://api.example.com/callback',
            successUrl: 'https://example.com/success',
            failureUrl: 'https://example.com/failure',
            credentials: ['merchant_id' => 'x'],
            sandbox: false,
        );
    }

    public function test_innecobank_initiate_returns_not_implemented(): void
    {
        $response = (new InnecobankGateway())->initiate($this->makePaymentRequest());

        $this->assertFalse($response->success);
        $this->assertStringContainsString('coming soon', $response->errorMessage);
    }

    public function test_innecobank_verify_returns_not_implemented(): void
    {
        $response = (new InnecobankGateway())->verify([]);

        $this->assertFalse($response->success);
        $this->assertEquals('failed', $response->status);
    }

    public function test_converse_bank_initiate_returns_not_implemented(): void
    {
        $response = (new ConverseBankGateway())->initiate($this->makePaymentRequest());

        $this->assertFalse($response->success);
        $this->assertStringContainsString('coming soon', $response->errorMessage);
    }

    public function test_registry_register_and_get(): void
    {
        $registry = new PaymentGatewayRegistry();
        $gateway  = new IdramGateway();

        $registry->register('idram', $gateway);

        $this->assertSame($gateway, $registry->get('idram'));
        $this->assertTrue($registry->has('idram'));
        $this->assertFalse($registry->has('unknown'));
        $this->assertCount(1, $registry->all());
    }

    public function test_registry_get_unregistered_throws(): void
    {
        $this->expectException(RuntimeException::class);

        (new PaymentGatewayRegistry())->get('nonexistent');
    }
}
