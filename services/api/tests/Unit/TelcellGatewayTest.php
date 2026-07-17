<?php

namespace Tests\Unit;

use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\Gateways\TelcellGateway;
use Tests\TestCase;

class TelcellGatewayTest extends TestCase
{
    private const CURRENCY = '֏';

    private TelcellGateway $telcell;

    protected function setUp(): void
    {
        parent::setUp();
        $this->telcell = new TelcellGateway();
    }

    private function makePaymentRequest(array $overrides = []): PaymentRequest
    {
        return new PaymentRequest(
            orderId: $overrides['orderId'] ?? '550e8400-e29b-41d4-a716-446655440000',
            orderNumber: 'VEND-2026-00001',
            amount: $overrides['amount'] ?? 15000.00,
            currency: 'AMD',
            description: $overrides['description'] ?? 'Test Order',
            callbackUrl: 'https://api.example.com/callback/telcell',
            successUrl: 'https://example.com/success',
            failureUrl: 'https://example.com/failure',
            credentials: array_key_exists('credentials', $overrides)
                ? $overrides['credentials']
                : ['issuer' => 'shop@test.am', 'shop_key' => 'SECRET123', 'valid_days' => '10'],
            sandbox: $overrides['sandbox'] ?? false,
        );
    }

    public function test_get_name(): void
    {
        $this->assertEquals('telcell', $this->telcell->getName());
    }

    public function test_sandbox_mode_returns_internal_sandbox_url(): void
    {
        $response = $this->telcell->initiate($this->makePaymentRequest(['sandbox' => true]));

        $this->assertTrue($response->success);
        $this->assertStringContainsString('/api/v1/store/payments/sandbox/pay', $response->redirectUrl);
        $this->assertStringStartsWith('SANDBOX-', $response->paymentId);
    }

    public function test_empty_credentials_triggers_sandbox_mode(): void
    {
        $response = $this->telcell->initiate($this->makePaymentRequest(['credentials' => [], 'sandbox' => false]));

        $this->assertTrue($response->success);
        $this->assertStringContainsString('/api/v1/store/payments/sandbox/pay', $response->redirectUrl);
    }

    public function test_live_mode_posts_to_telcell_invoices_with_all_fields(): void
    {
        $response = $this->telcell->initiate($this->makePaymentRequest());

        $this->assertTrue($response->success);
        $this->assertEquals('https://telcellmoney.am/invoices', $response->redirectUrl);

        $params = $response->rawResponse;
        $this->assertEquals('PostInvoice', $params['action']);
        $this->assertEquals('shop@test.am', $params['issuer']);
        $this->assertEquals(self::CURRENCY, $params['currency']);
        $this->assertEquals('15000', $params['price']);
        $this->assertEquals(base64_encode('Test Order'), $params['product']);
        $this->assertEquals(base64_encode('550e8400-e29b-41d4-a716-446655440000'), $params['issuer_id']);
        $this->assertEquals('10', $params['valid_days']);
        $this->assertArrayHasKey('security_code', $params);
    }

    public function test_live_mode_builds_correct_security_code(): void
    {
        $response = $this->telcell->initiate($this->makePaymentRequest());
        $params   = $response->rawResponse;

        $expected = md5(
            'SECRET123' .
            'shop@test.am' .
            self::CURRENCY .
            '15000' .
            base64_encode('Test Order') .
            base64_encode('550e8400-e29b-41d4-a716-446655440000') .
            '10'
        );

        $this->assertEquals($expected, $params['security_code']);
    }

    public function test_amount_is_rounded_to_whole_dram(): void
    {
        $response = $this->telcell->initiate($this->makePaymentRequest(['amount' => 199.50]));

        $this->assertEquals('200', $response->rawResponse['price']);
    }

    public function test_valid_days_defaults_to_one_when_absent(): void
    {
        $response = $this->telcell->initiate($this->makePaymentRequest([
            'credentials' => ['issuer' => 'shop@test.am', 'shop_key' => 'SECRET123'],
        ]));

        $this->assertEquals('1', $response->rawResponse['valid_days']);
    }

    private function buildCallbackChecksum(array $data, string $shopKey): string
    {
        return md5(
            $shopKey .
            $data['invoice'] .
            $data['issuer_id'] .
            $data['payment_id'] .
            $data['currency'] .
            $data['sum'] .
            $data['time'] .
            $data['status']
        );
    }

    private function callbackPayload(array $overrides = []): array
    {
        $data = array_merge([
            'invoice'    => 'TC-INV-777',
            'issuer_id'  => base64_encode('550e8400-e29b-41d4-a716-446655440000'),
            'payment_id' => 'TC-PAY-999',
            'currency'   => self::CURRENCY,
            'sum'        => '15000',
            'time'       => '2026-07-17 12:30:00',
            'status'     => 'PAID',
        ], $overrides);

        if (!isset($data['checksum'])) {
            $data['checksum'] = $this->buildCallbackChecksum($data, 'SECRET123');
        }

        return $data;
    }

    public function test_verify_valid_paid_callback_returns_paid(): void
    {
        $response = $this->telcell->verify(
            $this->callbackPayload(),
            ['issuer' => 'shop@test.am', 'shop_key' => 'SECRET123']
        );

        $this->assertTrue($response->success);
        $this->assertEquals('paid', $response->status);
        $this->assertEquals('TC-PAY-999', $response->transactionId);
        $this->assertEquals(15000.0, $response->amount);
        $this->assertNull($response->errorMessage);
    }

    public function test_verify_accepts_uppercase_checksum(): void
    {
        $payload             = $this->callbackPayload();
        $payload['checksum'] = strtoupper($payload['checksum']);

        $response = $this->telcell->verify($payload, ['shop_key' => 'SECRET123']);

        $this->assertTrue($response->success);
        $this->assertEquals('paid', $response->status);
    }

    public function test_verify_rejected_callback_returns_rejected_not_failed(): void
    {
        $response = $this->telcell->verify(
            $this->callbackPayload(['status' => 'REJECTED']),
            ['shop_key' => 'SECRET123']
        );

        $this->assertFalse($response->success);
        $this->assertEquals('rejected', $response->status);
        $this->assertEquals('TC-PAY-999', $response->transactionId);
    }

    public function test_verify_invalid_checksum_returns_failed(): void
    {
        $response = $this->telcell->verify(
            $this->callbackPayload(['checksum' => 'deadbeefdeadbeefdeadbeefdeadbeef']),
            ['shop_key' => 'SECRET123']
        );

        $this->assertFalse($response->success);
        $this->assertEquals('failed', $response->status);
        $this->assertEquals('Invalid checksum', $response->errorMessage);
    }

    public function test_verify_missing_credentials_returns_failed(): void
    {
        $response = $this->telcell->verify($this->callbackPayload(), []);

        $this->assertFalse($response->success);
        $this->assertEquals('failed', $response->status);
        $this->assertNotNull($response->errorMessage);
    }

    public function test_extract_order_reference_decodes_issuer_id(): void
    {
        $uuid = '550e8400-e29b-41d4-a716-446655440000';

        $this->assertEquals(
            $uuid,
            $this->telcell->extractOrderReference(['issuer_id' => base64_encode($uuid)])
        );
    }

    public function test_extract_order_reference_returns_null_without_issuer_id(): void
    {
        $this->assertNull($this->telcell->extractOrderReference([]));
    }

    public function test_get_required_fields(): void
    {
        $keys = array_column($this->telcell->getRequiredFields(), 'key');

        $this->assertContains('issuer', $keys);
        $this->assertContains('shop_key', $keys);
        $this->assertContains('valid_days', $keys);
    }

    public function test_validate_credentials(): void
    {
        $this->assertTrue($this->telcell->validateCredentials(['issuer' => 'a@b.am', 'shop_key' => 'k']));
        $this->assertFalse($this->telcell->validateCredentials(['issuer' => 'a@b.am']));
        $this->assertFalse($this->telcell->validateCredentials([]));
    }

    public function test_refund_is_manual(): void
    {
        $response = $this->telcell->refund('TC-PAY-999', 15000.0);

        $this->assertFalse($response->success);
        $this->assertStringContainsString('manually', $response->errorMessage);
    }
}
