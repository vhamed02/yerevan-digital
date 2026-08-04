<?php

namespace Tests\Unit;

use App\Services\PaymentGateway\DTOs\PaymentInitiateResponse;
use App\Services\PaymentGateway\DTOs\PaymentRequest;
use App\Services\PaymentGateway\Gateways\IdramGateway;
use Tests\TestCase;

/**
 * Asserted against Idram's "Idram Payment System merchant interface
 * description" — every expectation here traces to a documented field, URL or
 * checksum formula, not to how the code happens to behave.
 */
class IdramGatewayTest extends TestCase
{
    private IdramGateway $idram;

    private const REC_ACCOUNT = '100000114';
    private const SECRET      = 'FakeKey';
    private const BILL_NO     = '550e8400-e29b-41d4-a716-446655440000';

    protected function setUp(): void
    {
        parent::setUp();
        $this->idram = new IdramGateway();
    }

    private function makeRequest(array $overrides = []): PaymentRequest
    {
        return new PaymentRequest(
            orderId: self::BILL_NO,
            orderNumber: 'VEND-2026-00001',
            amount: $overrides['amount'] ?? 15000.00,
            currency: 'AMD',
            description: 'Test Order',
            callbackUrl: 'https://api.example.com/callback/idram',
            successUrl: 'https://example.com/success',
            failureUrl: 'https://example.com/failure',
            credentials: $overrides['credentials'] ?? [
                'rec_account' => self::REC_ACCOUNT,
                'secret_key'  => self::SECRET,
            ],
            sandbox: $overrides['sandbox'] ?? false,
            options: $overrides['options'] ?? [],
        );
    }

    /** The documented confirmation signature: rec:amount:secret:bill:payer:trans:date. */
    private function confirmChecksum(array $fields): string
    {
        return strtoupper(md5(implode(':', [
            $fields['EDP_REC_ACCOUNT'],
            $fields['EDP_AMOUNT'],
            self::SECRET,
            $fields['EDP_BILL_NO'],
            $fields['EDP_PAYER_ACCOUNT'],
            $fields['EDP_TRANS_ID'],
            $fields['EDP_TRANS_DATE'],
        ])));
    }

    private function confirmPayload(array $overrides = []): array
    {
        $fields = array_merge([
            'EDP_REC_ACCOUNT'   => self::REC_ACCOUNT,
            'EDP_AMOUNT'        => '15000.00',
            'EDP_BILL_NO'       => self::BILL_NO,
            'EDP_PAYER_ACCOUNT' => '200000456',
            'EDP_TRANS_ID'      => '12345678901234',
            'EDP_TRANS_DATE'    => '04/08/2026',
        ], $overrides);

        return $fields + ['EDP_CHECKSUM' => $this->confirmChecksum($fields)];
    }

    // ---------------------------------------------------------------- initiate

    public function test_wallet_posts_to_the_documented_idram_endpoint(): void
    {
        $response = $this->idram->initiate($this->makeRequest());

        $this->assertTrue($response->success);
        $this->assertSame('https://banking.idram.am/Payment/GetPayment', $response->redirectUrl);
        $this->assertSame(PaymentInitiateResponse::MODE_FORM, $response->mode);
    }

    public function test_wallet_form_carries_exactly_the_documented_fields(): void
    {
        $response = $this->idram->initiate($this->makeRequest());

        $this->assertSame([
            'EDP_LANGUAGE'    => 'EN',
            'EDP_REC_ACCOUNT' => self::REC_ACCOUNT,
            'EDP_DESCRIPTION' => 'Test Order',
            'EDP_AMOUNT'      => '15000.00',
            'EDP_BILL_NO'     => self::BILL_NO,
        ], $response->rawResponse);
    }

    /**
     * The request is unsigned and the return addresses are fixed merchant-side.
     * An earlier revision invented all three; sending them is not the protocol.
     */
    public function test_wallet_form_sends_no_checksum_and_no_return_urls(): void
    {
        $params = $this->idram->initiate($this->makeRequest())->rawResponse;

        $this->assertArrayNotHasKey('EDP_CHECKSUM', $params);
        $this->assertArrayNotHasKey('EDP_SUCCESS_URL', $params);
        $this->assertArrayNotHasKey('EDP_FAILURE_URL', $params);
    }

    public function test_optional_email_credential_is_forwarded_when_set(): void
    {
        $params = $this->idram->initiate($this->makeRequest(['credentials' => [
            'rec_account' => self::REC_ACCOUNT,
            'secret_key'  => self::SECRET,
            'email'       => 'shop@example.am',
        ]]))->rawResponse;

        $this->assertSame('shop@example.am', $params['EDP_EMAIL']);
    }

    public function test_language_maps_to_idram_codes(): void
    {
        foreach (['hy' => 'AM', 'ru' => 'RU', 'en' => 'EN'] as $locale => $expected) {
            app()->setLocale($locale);
            $params = $this->idram->initiate($this->makeRequest())->rawResponse;
            $this->assertSame($expected, $params['EDP_LANGUAGE'], "locale {$locale}");
        }
    }

    public function test_card_option_returns_an_iframe_url(): void
    {
        app()->setLocale('en');

        $response = $this->idram->initiate($this->makeRequest(['options' => ['method' => 'card']]));

        $this->assertSame(PaymentInitiateResponse::MODE_IFRAME, $response->mode);
        $this->assertStringStartsWith('https://money.idram.am/EN/ccepayMerchant.aspx?', $response->redirectUrl);
        $this->assertStringContainsString('EDP_REC_ACCOUNT=' . self::REC_ACCOUNT, $response->redirectUrl);
        $this->assertStringContainsString('EDP_AMOUNT=15000.00', $response->redirectUrl);
        $this->assertStringContainsString('EDP_BILL_NO=' . self::BILL_NO, $response->redirectUrl);
        $this->assertSame([], $response->rawResponse);
    }

    public function test_sandbox_flag_falls_back_to_the_internal_simulator(): void
    {
        $response = $this->idram->initiate($this->makeRequest(['sandbox' => true]));

        $this->assertTrue($response->success);
        $this->assertStringContainsString('/store/payments/sandbox/pay', (string) $response->redirectUrl);
        $this->assertStringStartsWith('SANDBOX-', (string) $response->paymentId);
    }

    public function test_incomplete_credentials_fall_back_to_the_simulator(): void
    {
        foreach ([[], ['rec_account' => self::REC_ACCOUNT], ['secret_key' => self::SECRET]] as $credentials) {
            $response = $this->idram->initiate($this->makeRequest([
                'credentials' => $credentials,
                'sandbox'     => false,
            ]));

            $this->assertStringStartsWith('SANDBOX-', (string) $response->paymentId);
        }
    }

    // ------------------------------------------------------------------ verify

    public function test_verify_accepts_the_documented_checksum(): void
    {
        $payload  = $this->confirmPayload();
        $response = $this->idram->verify($payload, [
            'rec_account' => self::REC_ACCOUNT,
            'secret_key'  => self::SECRET,
        ]);

        $this->assertTrue($response->success);
        $this->assertSame('paid', $response->status);
        $this->assertSame('12345678901234', $response->transactionId);
        $this->assertSame(15000.00, $response->amount);
    }

    /** Idram's own sample compares case-insensitively. */
    public function test_verify_accepts_a_lowercase_checksum(): void
    {
        $payload                 = $this->confirmPayload();
        $payload['EDP_CHECKSUM'] = strtolower($payload['EDP_CHECKSUM']);

        $response = $this->idram->verify($payload, [
            'rec_account' => self::REC_ACCOUNT,
            'secret_key'  => self::SECRET,
        ]);

        $this->assertTrue($response->success);
    }

    public function test_verify_rejects_a_tampered_amount(): void
    {
        $payload               = $this->confirmPayload();
        $payload['EDP_AMOUNT'] = '1.00';

        $response = $this->idram->verify($payload, [
            'rec_account' => self::REC_ACCOUNT,
            'secret_key'  => self::SECRET,
        ]);

        $this->assertFalse($response->success);
        $this->assertSame('Invalid checksum', $response->errorMessage);
    }

    /**
     * The signature is built from our configured account, not the payload's, so
     * a callback naming someone else's merchant can never validate.
     */
    public function test_verify_rejects_a_callback_for_another_merchant(): void
    {
        $foreign = $this->confirmPayload(['EDP_REC_ACCOUNT' => '999999999']);

        $response = $this->idram->verify($foreign, [
            'rec_account' => self::REC_ACCOUNT,
            'secret_key'  => self::SECRET,
        ]);

        $this->assertFalse($response->success);
    }

    public function test_verify_rejects_a_missing_checksum(): void
    {
        $payload = $this->confirmPayload();
        unset($payload['EDP_CHECKSUM']);

        $response = $this->idram->verify($payload, [
            'rec_account' => self::REC_ACCOUNT,
            'secret_key'  => self::SECRET,
        ]);

        $this->assertFalse($response->success);
        $this->assertSame('failed', $response->status);
    }

    public function test_verify_without_credentials_fails_closed(): void
    {
        $response = $this->idram->verify($this->confirmPayload(), []);

        $this->assertFalse($response->success);
        $this->assertSame('Missing credentials for verification', $response->errorMessage);
    }

    // ---------------------------------------------------------------- precheck

    public function test_precheck_is_recognised_and_confirmation_is_not(): void
    {
        $this->assertTrue($this->idram->isPrecheck(['EDP_PRECHECK' => 'YES']));
        $this->assertTrue($this->idram->isPrecheck(['EDP_PRECHECK' => 'yes']));
        $this->assertFalse($this->idram->isPrecheck($this->confirmPayload()));
        $this->assertFalse($this->idram->isPrecheck([]));
    }

    public function test_precheck_accessors_read_the_documented_fields(): void
    {
        $payload = [
            'EDP_PRECHECK'    => 'YES',
            'EDP_BILL_NO'     => self::BILL_NO,
            'EDP_REC_ACCOUNT' => self::REC_ACCOUNT,
            'EDP_AMOUNT'      => '15000.00',
        ];

        $this->assertSame(self::BILL_NO, $this->idram->extractOrderReference($payload));
        $this->assertSame(self::REC_ACCOUNT, $this->idram->precheckRecipient($payload));
        $this->assertSame('15000.00', $this->idram->precheckAmount($payload));
        $this->assertNull($this->idram->precheckAmount(['EDP_AMOUNT' => 'not-a-number']));
    }

    // ------------------------------------------------------------------- misc

    public function test_extract_order_reference_handles_absent_bill_number(): void
    {
        $this->assertNull($this->idram->extractOrderReference([]));
        $this->assertNull($this->idram->extractOrderReference(['EDP_BILL_NO' => '']));
    }

    public function test_legacy_credential_keys_still_resolve(): void
    {
        $this->assertSame('A', $this->idram->recipientFromCredentials(['rec_account' => 'A']));
        $this->assertSame('B', $this->idram->recipientFromCredentials(['edp_id' => 'B']));
        $this->assertSame('C', $this->idram->recipientFromCredentials(['account_id' => 'C']));
        $this->assertNull($this->idram->recipientFromCredentials([]));
    }

    public function test_validate_credentials_requires_account_and_secret(): void
    {
        $this->assertTrue($this->idram->validateCredentials([
            'rec_account' => self::REC_ACCOUNT,
            'secret_key'  => self::SECRET,
        ]));
        $this->assertFalse($this->idram->validateCredentials(['rec_account' => self::REC_ACCOUNT]));
        $this->assertFalse($this->idram->validateCredentials(['secret_key' => self::SECRET]));
        $this->assertFalse($this->idram->validateCredentials([]));
    }

    public function test_refunds_are_refused(): void
    {
        $response = $this->idram->refund('12345678901234', 100.0);

        $this->assertFalse($response->success);
        $this->assertStringContainsString('manually', (string) $response->errorMessage);
    }

    public function test_get_name(): void
    {
        $this->assertSame('idram', $this->idram->getName());
    }
}
