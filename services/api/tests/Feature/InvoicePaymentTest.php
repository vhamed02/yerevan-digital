<?php

namespace Tests\Feature;

use App\Enums\InvoiceStatus;
use App\Models\CommissionInvoice;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoicePaymentTest extends TestCase
{
    use RefreshDatabase;

    private const CURRENCY = '֏';

    private User  $seller;
    private Store $store;
    private string $shopKey = 'platform_secret_key_123';
    private string $issuer  = 'platform@yerevan.digital';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->seller = User::factory()->seller()->create();
        $this->seller->assignRole('seller');
        $this->store = Store::factory()->create(['user_id' => $this->seller->id]);
    }

    private function invoice(array $overrides = []): CommissionInvoice
    {
        return CommissionInvoice::factory()->create(array_merge([
            'store_id' => $this->store->id,
            'amount'   => '750.00',
        ], $overrides));
    }

    public function test_pay_returns_sandbox_redirect_when_platform_credentials_are_unset(): void
    {
        config(['telcell.platform' => ['issuer' => null, 'shop_key' => null, 'valid_days' => '3']]);
        $invoice = $this->invoice();

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/invoices/{$invoice->uuid}/pay")
            ->assertOk();

        $this->assertStringContainsString('sandbox', $response->json('data.redirect_url'));
        $this->assertNull($response->json('data.form_params'));
    }

    public function test_pay_posts_to_telcell_with_platform_credentials_when_configured(): void
    {
        config(['telcell.platform' => [
            'issuer'     => $this->issuer,
            'shop_key'   => $this->shopKey,
            'valid_days' => '3',
        ]]);
        $invoice = $this->invoice(['amount' => '750.00']);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/invoices/{$invoice->uuid}/pay")
            ->assertOk();

        $this->assertSame('https://telcellmoney.am/invoices', $response->json('data.redirect_url'));
        $params = $response->json('data.form_params');
        $this->assertSame($this->issuer, $params['issuer']);
        $this->assertSame('750', $params['price']);
        $this->assertSame(base64_encode($invoice->uuid), $params['issuer_id']);
    }

    public function test_pay_rejects_an_invoice_that_is_not_pending(): void
    {
        $invoice = $this->invoice(['status' => InvoiceStatus::Paid]);

        $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/invoices/{$invoice->uuid}/pay")
            ->assertStatus(422);
    }

    public function test_a_seller_cannot_pay_another_stores_invoice(): void
    {
        $other = User::factory()->seller()->create();
        $other->assignRole('seller');
        Store::factory()->create(['user_id' => $other->id]);
        $invoice = $this->invoice();

        $this->actingAs($other, 'sanctum')
            ->postJson("/api/v1/seller/invoices/{$invoice->uuid}/pay")
            ->assertNotFound();
    }

    private function callbackPayload(CommissionInvoice $invoice, array $overrides = []): array
    {
        $data = array_merge([
            'invoice'    => 'TC-INV-' . rand(1000, 9999),
            'issuer_id'  => base64_encode($invoice->uuid),
            'payment_id' => 'TC-PAY-' . rand(1000, 9999),
            'currency'   => self::CURRENCY,
            'sum'        => (string) (int) $invoice->amount,
            'time'       => '2026-07-20 12:30:00',
            'status'     => 'PAID',
        ], $overrides);

        if (!isset($data['checksum'])) {
            $data['checksum'] = md5(
                $this->shopKey .
                $data['invoice'] .
                $data['issuer_id'] .
                $data['payment_id'] .
                $data['currency'] .
                $data['sum'] .
                $data['time'] .
                $data['status']
            );
        }

        return $data;
    }

    public function test_valid_callback_marks_invoice_paid(): void
    {
        config(['telcell.platform' => ['issuer' => $this->issuer, 'shop_key' => $this->shopKey, 'valid_days' => '3']]);
        $invoice = $this->invoice();
        $payload = $this->callbackPayload($invoice);

        $this->postJson('/api/v1/invoices/callback/telcell', $payload)
            ->assertOk()
            ->assertSee('OK');

        $invoice->refresh();
        $this->assertEquals(InvoiceStatus::Paid, $invoice->status);
        $this->assertNotNull($invoice->paid_at);
        $this->assertSame($payload['payment_id'], $invoice->payment_reference);
        $this->assertSame($payload['invoice'], $invoice->external_invoice_id);
    }

    public function test_bad_checksum_is_rejected_and_invoice_stays_pending(): void
    {
        config(['telcell.platform' => ['issuer' => $this->issuer, 'shop_key' => $this->shopKey, 'valid_days' => '3']]);
        $invoice = $this->invoice();

        $this->postJson(
            '/api/v1/invoices/callback/telcell',
            $this->callbackPayload($invoice, ['checksum' => 'deadbeefdeadbeefdeadbeefdeadbeef'])
        )->assertStatus(400);

        $this->assertEquals(InvoiceStatus::Pending, $invoice->fresh()->status);
    }

    public function test_callback_for_already_paid_invoice_is_idempotent(): void
    {
        config(['telcell.platform' => ['issuer' => $this->issuer, 'shop_key' => $this->shopKey, 'valid_days' => '3']]);
        $invoice = $this->invoice(['status' => InvoiceStatus::Paid, 'paid_at' => now()]);

        $this->postJson('/api/v1/invoices/callback/telcell', $this->callbackPayload($invoice))
            ->assertOk()
            ->assertSee('OK');
    }

    public function test_callback_with_missing_issuer_id_returns_422(): void
    {
        $this->postJson('/api/v1/invoices/callback/telcell', ['sum' => '750', 'status' => 'PAID'])
            ->assertStatus(422);
    }

    // ------------------------------------------------------------------- idram
    //
    // The platform's own Idram merchant account, collecting commission from
    // sellers — the reverse direction from checkout.

    private string $idramAccount = '100000114';
    private string $idramSecret  = 'platform_idram_secret';

    private function useIdramPlatform(): void
    {
        config(['idram.platform' => [
            'rec_account' => $this->idramAccount,
            'secret_key'  => $this->idramSecret,
            'email'       => null,
        ]]);
    }

    private function idramPayload(CommissionInvoice $invoice, array $overrides = []): array
    {
        $fields = array_merge([
            'EDP_REC_ACCOUNT'   => $this->idramAccount,
            'EDP_AMOUNT'        => (string) $invoice->amount,
            'EDP_BILL_NO'       => $invoice->uuid,
            'EDP_PAYER_ACCOUNT' => '200000456',
            'EDP_TRANS_ID'      => (string) rand(10000000000000, 99999999999999),
            'EDP_TRANS_DATE'    => '04/08/2026',
        ], $overrides);

        return $fields + ['EDP_CHECKSUM' => strtoupper(md5(implode(':', [
            $fields['EDP_REC_ACCOUNT'],
            $fields['EDP_AMOUNT'],
            $this->idramSecret,
            $fields['EDP_BILL_NO'],
            $fields['EDP_PAYER_ACCOUNT'],
            $fields['EDP_TRANS_ID'],
            $fields['EDP_TRANS_DATE'],
        ])))];
    }

    public function test_pay_via_idram_posts_the_wallet_form(): void
    {
        $this->useIdramPlatform();
        $invoice = $this->invoice(['amount' => '750.00']);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/invoices/{$invoice->uuid}/pay", ['gateway' => 'idram'])
            ->assertOk();

        $this->assertSame('https://banking.idram.am/Payment/GetPayment', $response->json('data.redirect_url'));
        $this->assertSame('form', $response->json('data.mode'));

        $params = $response->json('data.form_params');
        $this->assertSame($this->idramAccount, $params['EDP_REC_ACCOUNT']);
        $this->assertSame($invoice->uuid, $params['EDP_BILL_NO']);
        $this->assertSame('750.00', $params['EDP_AMOUNT']);
    }

    public function test_pay_rejects_a_gateway_the_platform_cannot_collect_with(): void
    {
        // Telcell configured, Idram not — Idram must not be offered.
        config(['telcell.platform' => ['issuer' => $this->issuer, 'shop_key' => $this->shopKey, 'valid_days' => '3']]);
        config(['idram.platform' => ['rec_account' => null, 'secret_key' => null, 'email' => null]]);
        $invoice = $this->invoice();

        $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/v1/seller/invoices/{$invoice->uuid}/pay", ['gateway' => 'idram'])
            ->assertStatus(422);
    }

    public function test_payment_methods_lists_only_configured_platform_accounts(): void
    {
        $this->useIdramPlatform();
        config(['telcell.platform' => ['issuer' => null, 'shop_key' => null, 'valid_days' => '3']]);

        $this->actingAs($this->seller, 'sanctum')
            ->getJson('/api/v1/seller/invoices/payment-methods')
            ->assertOk()
            ->assertJsonPath('data', ['idram']);
    }

    public function test_payment_methods_route_is_not_shadowed_by_the_uuid_route(): void
    {
        $this->actingAs($this->seller, 'sanctum')
            ->getJson('/api/v1/seller/invoices/payment-methods')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_idram_callback_marks_invoice_paid(): void
    {
        $this->useIdramPlatform();
        $invoice = $this->invoice(['amount' => '750.00']);
        $payload = $this->idramPayload($invoice);

        $this->post('/api/v1/invoices/callback/idram', $payload)
            ->assertOk()
            ->assertSee('OK');

        $invoice->refresh();
        $this->assertEquals(InvoiceStatus::Paid, $invoice->status);
        $this->assertNotNull($invoice->paid_at);
        $this->assertSame($payload['EDP_TRANS_ID'], $invoice->payment_reference);
    }

    public function test_idram_callback_with_bad_checksum_leaves_invoice_pending(): void
    {
        $this->useIdramPlatform();
        $invoice = $this->invoice();

        $this->post(
            '/api/v1/invoices/callback/idram',
            $this->idramPayload($invoice, ['EDP_CHECKSUM' => 'deadbeefdeadbeefdeadbeefdeadbeef'])
        )->assertStatus(400);

        $this->assertEquals(InvoiceStatus::Pending, $invoice->fresh()->status);
    }

    public function test_idram_invoice_precheck_answers_ok_without_settling(): void
    {
        $this->useIdramPlatform();
        $invoice = $this->invoice(['amount' => '750.00']);

        $response = $this->post('/api/v1/invoices/callback/idram', [
            'EDP_PRECHECK'    => 'YES',
            'EDP_BILL_NO'     => $invoice->uuid,
            'EDP_REC_ACCOUNT' => $this->idramAccount,
            'EDP_AMOUNT'      => '750.00',
        ]);

        $response->assertOk();
        $this->assertSame('OK', $response->getContent());
        $this->assertEquals(InvoiceStatus::Pending, $invoice->fresh()->status);
    }

    public function test_idram_invoice_precheck_is_refused_on_amount_mismatch(): void
    {
        $this->useIdramPlatform();
        $invoice = $this->invoice(['amount' => '750.00']);

        $response = $this->post('/api/v1/invoices/callback/idram', [
            'EDP_PRECHECK'    => 'YES',
            'EDP_BILL_NO'     => $invoice->uuid,
            'EDP_REC_ACCOUNT' => $this->idramAccount,
            'EDP_AMOUNT'      => '1.00',
        ]);

        $response->assertOk();
        $this->assertNotSame('OK', $response->getContent());
    }

    public function test_invoice_callback_for_an_unsupported_gateway_is_not_routed(): void
    {
        $this->post('/api/v1/invoices/callback/stripe', [])->assertNotFound();
    }
}
