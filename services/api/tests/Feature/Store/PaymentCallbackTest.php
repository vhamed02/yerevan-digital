<?php

namespace Tests\Feature\Store;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Enums\StoreStatus;
use App\Enums\TransactionStatus;
use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Models\Store;
use App\Models\StorePaymentGateway;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\NewOrderNotification;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PaymentCallbackTest extends TestCase
{
    use RefreshDatabase;

    private Store          $store;
    private Order          $order;
    private Transaction    $transaction;
    private PaymentGateway $gateway;
    private string         $secretKey = 'test_secret_key_123';
    private string         $edpId     = 'TEST_STORE_123';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $seller = User::factory()->seller()->create();
        $seller->assignRole('seller');

        $this->store = Store::factory()->create([
            'user_id' => $seller->id,
            'status'  => StoreStatus::Active,
        ]);

        $product = Product::factory()->create([
            'store_id' => $this->store->id,
            'status'   => ProductStatus::Active,
            'price'    => 15000,
        ]);

        $this->gateway = PaymentGateway::factory()->create([
            'name'      => 'idram',
            'is_active' => true,
        ]);

        StorePaymentGateway::create([
            'store_id'           => $this->store->id,
            'payment_gateway_id' => $this->gateway->id,
            'is_enabled'         => true,
            'is_sandbox'         => false,
            'credentials'        => ['secret_key' => $this->secretKey, 'rec_account' => $this->edpId],
        ]);

        $this->order = Order::create([
            'store_id'        => $this->store->id,
            'status'          => OrderStatus::Pending,
            'payment_status'  => PaymentStatus::Pending,
            'subtotal'        => 15000,
            'discount'        => 0,
            'shipping_cost'   => 0,
            'tax'             => 0,
            'total'           => 15000,
            'currency'        => 'AMD',
            'customer_name'   => 'Test User',
            'customer_email'  => 'test@example.com',
            'shipping_address' => ['city' => 'Yerevan', 'address' => 'Test St 1'],
        ]);

        $this->transaction = Transaction::create([
            'order_id'           => $this->order->id,
            'store_id'           => $this->store->id,
            'payment_gateway_id' => $this->gateway->id,
            'amount'             => 15000,
            'currency'           => 'AMD',
            'status'             => TransactionStatus::Pending,
            'initiated_at'       => now(),
        ]);
    }

    /** Documented order: rec : amount : secret : bill : payer : trans_id : trans_date. */
    private function buildIdramChecksum(array $fields): string
    {
        return strtoupper(md5(implode(':', [
            $fields['EDP_REC_ACCOUNT'],
            $fields['EDP_AMOUNT'],
            $this->secretKey,
            $fields['EDP_BILL_NO'],
            $fields['EDP_PAYER_ACCOUNT'],
            $fields['EDP_TRANS_ID'],
            $fields['EDP_TRANS_DATE'],
        ])));
    }

    private function idramCallbackPayload(array $overrides = []): array
    {
        $fields = array_merge([
            'EDP_BILL_NO'       => $this->order->uuid,
            'EDP_REC_ACCOUNT'   => $this->edpId,
            'EDP_AMOUNT'        => '15000.00',
            'EDP_PAYER_ACCOUNT' => '200000456',
            'EDP_TRANS_ID'      => (string) rand(10000000000000, 99999999999999),
            'EDP_TRANS_DATE'    => '04/08/2026',
        ], $overrides);

        return $fields + ['EDP_CHECKSUM' => $this->buildIdramChecksum($fields)];
    }

    private function precheckPayload(array $overrides = []): array
    {
        return array_merge([
            'EDP_PRECHECK'    => 'YES',
            'EDP_BILL_NO'     => $this->order->uuid,
            'EDP_REC_ACCOUNT' => $this->edpId,
            'EDP_AMOUNT'      => '15000.00',
        ], $overrides);
    }

    public function test_successful_idram_callback_marks_order_paid(): void
    {
        Notification::fake();

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->idramCallbackPayload()
        )
            ->assertOk()
            ->assertSee('OK');

        $this->order->refresh();
        $this->assertEquals(PaymentStatus::Paid, $this->order->payment_status);
        $this->assertEquals(OrderStatus::Processing, $this->order->status);
        $this->assertNotNull($this->order->paid_at);
    }

    public function test_successful_callback_transitions_transaction_to_success(): void
    {
        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->idramCallbackPayload()
        )->assertOk();

        $this->assertEquals(TransactionStatus::Success, $this->transaction->fresh()->status);
    }

    public function test_successful_callback_sends_new_order_notification(): void
    {
        Notification::fake();

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->idramCallbackPayload()
        )->assertOk();

        Notification::assertSentTo($this->store->owner, NewOrderNotification::class);
    }

    public function test_callback_with_invalid_checksum_returns_400(): void
    {
        $payload = $this->idramCallbackPayload(['EDP_CHECKSUM' => 'INVALID_CHECKSUM']);

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $payload
        )->assertStatus(400);

        $this->assertEquals(TransactionStatus::Failed, $this->transaction->fresh()->status);
        $this->assertEquals(PaymentStatus::Pending, $this->order->fresh()->payment_status);
    }

    public function test_callback_for_already_paid_order_is_idempotent(): void
    {
        $this->order->update([
            'payment_status' => PaymentStatus::Paid,
            'status'         => OrderStatus::Processing,
            'paid_at'        => now(),
        ]);

        $this->transaction->update(['status' => TransactionStatus::Success]);

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->idramCallbackPayload()
        )
            ->assertOk()
            ->assertSee('OK');

        $this->assertEquals(PaymentStatus::Paid, $this->order->fresh()->payment_status);
    }

    public function test_callback_with_missing_order_reference_returns_422(): void
    {
        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            ['EDP_AMOUNT' => '15000.00']
        )->assertStatus(422);
    }

    public function test_callback_for_unknown_gateway_returns_404(): void
    {
        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/unknown_gateway",
            $this->idramCallbackPayload()
        )->assertStatus(404);
    }

    // ---------------------------------------------------------------- precheck
    //
    // Idram asks "is this bill real?" before debiting the customer. Anything but
    // a literal OK aborts the payment, so a false negative here means no store
    // can ever take money.

    public function test_precheck_for_a_valid_pending_order_answers_ok(): void
    {
        $response = $this->post(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload()
        );

        $response->assertOk();
        $this->assertSame('OK', $response->getContent());
    }

    public function test_precheck_does_not_touch_the_order_or_transaction(): void
    {
        $this->post(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload()
        )->assertOk();

        $this->assertEquals(PaymentStatus::Pending, $this->order->fresh()->payment_status);
        $this->assertEquals(OrderStatus::Pending, $this->order->fresh()->status);
        $this->assertEquals(TransactionStatus::Pending, $this->transaction->fresh()->status);
        $this->assertNull($this->order->fresh()->paid_at);
    }

    public function test_precheck_is_refused_for_an_unknown_bill_number(): void
    {
        $response = $this->post(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload(['EDP_BILL_NO' => '550e8400-e29b-41d4-a716-000000000000'])
        );

        $response->assertOk();
        $this->assertNotSame('OK', $response->getContent());
    }

    public function test_precheck_is_refused_when_the_amount_does_not_match(): void
    {
        $response = $this->post(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload(['EDP_AMOUNT' => '1.00'])
        );

        $response->assertOk();
        $this->assertNotSame('OK', $response->getContent());
    }

    /** Trailing zeros differ, value does not — this must still authorise. */
    public function test_precheck_compares_amounts_numerically(): void
    {
        $response = $this->post(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload(['EDP_AMOUNT' => '15000'])
        );

        $response->assertOk();
        $this->assertSame('OK', $response->getContent());
    }

    public function test_precheck_is_refused_for_another_merchants_account(): void
    {
        $response = $this->post(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload(['EDP_REC_ACCOUNT' => '999999999'])
        );

        $response->assertOk();
        $this->assertNotSame('OK', $response->getContent());
    }

    public function test_precheck_is_refused_for_an_already_paid_order(): void
    {
        $this->order->update([
            'payment_status' => PaymentStatus::Paid,
            'status'         => OrderStatus::Processing,
            'paid_at'        => now(),
        ]);

        $response = $this->post(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload()
        );

        $response->assertOk();
        $this->assertNotSame('OK', $response->getContent());
    }

    public function test_precheck_is_refused_when_the_gateway_is_disabled(): void
    {
        StorePaymentGateway::where('store_id', $this->store->id)->update(['is_enabled' => false]);

        $response = $this->post(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload()
        );

        $response->assertOk();
        $this->assertNotSame('OK', $response->getContent());
    }

    public function test_precheck_is_refused_for_an_order_belonging_to_another_store(): void
    {
        $otherSeller = User::factory()->seller()->create();
        $otherStore  = Store::factory()->create([
            'user_id' => $otherSeller->id,
            'status'  => StoreStatus::Active,
        ]);

        StorePaymentGateway::create([
            'store_id'           => $otherStore->id,
            'payment_gateway_id' => $this->gateway->id,
            'is_enabled'         => true,
            'is_sandbox'         => false,
            'credentials'        => ['secret_key' => 'other', 'rec_account' => $this->edpId],
        ]);

        // Our order's bill number, presented on someone else's storefront.
        $response = $this->post(
            "/api/v1/store/{$otherStore->slug}/payments/callback/idram",
            $this->precheckPayload()
        );

        $response->assertOk();
        $this->assertNotSame('OK', $response->getContent());
    }
}
