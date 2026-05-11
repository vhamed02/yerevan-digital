<?php

namespace Tests\Unit;

use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\DTOs\PaymentVerifyResponse;
use App\Services\PaymentGateway\Gateways\ConverseBankGateway;
use App\Services\PaymentGateway\Gateways\IdramGateway;
use App\Services\PaymentGateway\Gateways\InnecobankGateway;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use RuntimeException;
use Tests\TestCase;

class PaymentGatewayTest extends TestCase
{
    private IdramGateway $idram;

    protected function setUp(): void
    {
        parent::setUp();
        $this->idram = new IdramGateway();
    }

    private function makePaymentRequest(array $overrides = []): PaymentRequest
    {
        return new PaymentRequest(
            orderId: '550e8400-e29b-41d4-a716-446655440000',
            orderNumber: 'VEND-2026-00001',
            amount: 15000.00,
            currency: 'AMD',
            description: 'Test Order',
            callbackUrl: 'https://api.example.com/callback/idram',
            successUrl: 'https://example.com/success',
            failureUrl: 'https://example.com/failure',
            credentials: $overrides['credentials'] ?? ['edp_id' => '12345', 'secret_key' => 'my-secret'],
            sandbox: $overrides['sandbox'] ?? false,
        );
    }

    public function test_idram_sandbox_mode_returns_sandbox_url(): void
    {
        $request  = $this->makePaymentRequest(['sandbox' => true]);
        $response = $this->idram->initiate($request);

        $this->assertTrue($response->success);
        $this->assertStringContainsString('/api/v1/store/payments/sandbox/pay', $response->redirectUrl);
        $this->assertStringStartsWith('SANDBOX-', $response->paymentId);
        $this->assertNull($response->errorMessage);
    }

    public function test_idram_empty_credentials_triggers_sandbox_mode(): void
    {
        $request  = $this->makePaymentRequest(['credentials' => [], 'sandbox' => false]);
        $response = $this->idram->initiate($request);

        $this->assertTrue($response->success);
        $this->assertStringContainsString('/api/v1/store/payments/sandbox/pay', $response->redirectUrl);
    }

    public function test_idram_live_mode_returns_live_url(): void
    {
        $request  = $this->makePaymentRequest(['sandbox' => false]);
        $response = $this->idram->initiate($request);

        $this->assertTrue($response->success);
        $this->assertStringContainsString('money.idram.am', $response->redirectUrl);
        $this->assertArrayHasKey('EDP_CHECKSUM', $response->rawResponse);
        $this->assertArrayHasKey('EDP_REC_ACCOUNT', $response->rawResponse);
        $this->assertEquals('12345', $response->rawResponse['EDP_REC_ACCOUNT']);
    }

    public function test_idram_live_mode_builds_correct_checksum(): void
    {
        $credentials = ['edp_id' => 'TEST_EDP', 'secret_key' => 'SECRET123'];
        $request     = $this->makePaymentRequest(['credentials' => $credentials, 'sandbox' => false]);
        $amount      = number_format(15000.00, 2, '.', '');
        $orderId     = '550e8400-e29b-41d4-a716-446655440000';

        $expected = strtoupper(md5('SECRET123:TEST_EDP:' . $amount . ':' . $orderId));

        $response = $this->idram->initiate($request);

        $this->assertEquals($expected, $response->rawResponse['EDP_CHECKSUM']);
    }

    public function test_idram_verify_valid_checksum_returns_paid(): void
    {
        $credentials = ['edp_id' => 'TEST_EDP', 'secret_key' => 'SECRET123'];

        $transId = 'TXN-99999';
        $amount  = '15000.00';
        $billNo  = '550e8400-e29b-41d4-a716-446655440000';

        $checksum = strtoupper(md5('SECRET123:TEST_EDP:' . $amount . ':' . $billNo . ':' . $transId));

        $callbackData = [
            'EDP_PAYER_ACCOUNT' => 'payer@idram',
            'EDP_REC_ACCOUNT'   => 'TEST_EDP',
            'EDP_AMOUNT'        => $amount,
            'EDP_BILL_NO'       => $billNo,
            'EDP_TRANS_ID'      => $transId,
            'EDP_CHECKSUM'      => $checksum,
        ];

        $response = $this->idram->verify($callbackData, $credentials);

        $this->assertTrue($response->success);
        $this->assertEquals('paid', $response->status);
        $this->assertEquals($transId, $response->transactionId);
        $this->assertEquals(15000.00, $response->amount);
        $this->assertNull($response->errorMessage);
    }

    public function test_idram_verify_invalid_checksum_returns_failed(): void
    {
        $credentials = ['edp_id' => 'TEST_EDP', 'secret_key' => 'SECRET123'];

        $callbackData = [
            'EDP_PAYER_ACCOUNT' => 'payer@idram',
            'EDP_REC_ACCOUNT'   => 'TEST_EDP',
            'EDP_AMOUNT'        => '15000.00',
            'EDP_BILL_NO'       => 'order-uuid',
            'EDP_TRANS_ID'      => 'TXN-123',
            'EDP_CHECKSUM'      => 'INVALID_CHECKSUM',
        ];

        $response = $this->idram->verify($callbackData, $credentials);

        $this->assertFalse($response->success);
        $this->assertEquals('failed', $response->status);
        $this->assertEquals('Invalid checksum', $response->errorMessage);
    }

    public function test_idram_verify_missing_credentials_returns_failed(): void
    {
        $response = $this->idram->verify(['EDP_BILL_NO' => 'some-uuid'], []);

        $this->assertFalse($response->success);
        $this->assertEquals('failed', $response->status);
        $this->assertNotNull($response->errorMessage);
    }

    public function test_idram_get_name(): void
    {
        $this->assertEquals('idram', $this->idram->getName());
    }

    public function test_idram_get_required_fields(): void
    {
        $fields = $this->idram->getRequiredFields();
        $keys   = array_column($fields, 'key');

        $this->assertContains('edp_id', $keys);
        $this->assertContains('secret_key', $keys);
    }

    public function test_idram_validate_credentials_passes_with_all_keys(): void
    {
        $this->assertTrue($this->idram->validateCredentials([
            'edp_id'     => '12345',
            'secret_key' => 'abc',
        ]));
    }

    public function test_idram_validate_credentials_fails_with_missing_key(): void
    {
        $this->assertFalse($this->idram->validateCredentials(['edp_id' => '12345']));
        $this->assertFalse($this->idram->validateCredentials([]));
    }

    public function test_innecobank_initiate_returns_not_implemented(): void
    {
        $gateway  = new InnecobankGateway();
        $response = $gateway->initiate($this->makePaymentRequest());

        $this->assertFalse($response->success);
        $this->assertStringContainsString('coming soon', $response->errorMessage);
    }

    public function test_innecobank_verify_returns_not_implemented(): void
    {
        $gateway  = new InnecobankGateway();
        $response = $gateway->verify([]);

        $this->assertFalse($response->success);
        $this->assertEquals('failed', $response->status);
    }

    public function test_converse_bank_initiate_returns_not_implemented(): void
    {
        $gateway  = new ConverseBankGateway();
        $response = $gateway->initiate($this->makePaymentRequest());

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
