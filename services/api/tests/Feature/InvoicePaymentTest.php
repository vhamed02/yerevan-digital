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
}
