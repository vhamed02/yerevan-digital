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

class IdramCallbackTest extends TestCase
{
    use RefreshDatabase;

    private Store          $store;
    private Order          $order;
    private Transaction    $transaction;
    private PaymentGateway $gateway;
    private string         $recAccount = '100000114';
    private string         $secretKey  = 'idram_secret_key_123';

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

        Product::factory()->create([
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
            'credentials'        => ['rec_account' => $this->recAccount, 'secret_key' => $this->secretKey],
        ]);

        $this->order = Order::create([
            'store_id'         => $this->store->id,
            'status'           => OrderStatus::Pending,
            'payment_status'   => PaymentStatus::Pending,
            'subtotal'         => 15000,
            'discount'         => 0,
            'shipping_cost'    => 0,
            'tax'              => 0,
            'total'            => 15000,
            'currency'         => 'AMD',
            'customer_name'    => 'Test User',
            'customer_email'   => 'test@example.com',
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

    private function confirmPayload(array $overrides = []): array
    {
        $fields = array_merge([
            'EDP_REC_ACCOUNT'   => $this->recAccount,
            'EDP_AMOUNT'        => '15000.00',
            'EDP_BILL_NO'       => $this->order->uuid,
            'EDP_PAYER_ACCOUNT' => '200000456',
            'EDP_TRANS_ID'      => '12345678901234',
            'EDP_TRANS_DATE'    => '04/08/2026',
        ], $overrides);

        if (!isset($fields['EDP_CHECKSUM'])) {
            $fields['EDP_CHECKSUM'] = strtoupper(md5(implode(':', [
                $fields['EDP_REC_ACCOUNT'],
                $fields['EDP_AMOUNT'],
                $this->secretKey,
                $fields['EDP_BILL_NO'],
                $fields['EDP_PAYER_ACCOUNT'],
                $fields['EDP_TRANS_ID'],
                $fields['EDP_TRANS_DATE'],
            ])));
        }

        return $fields;
    }

    private function precheckPayload(array $overrides = []): array
    {
        return array_merge([
            'EDP_PRECHECK'    => 'YES',
            'EDP_REC_ACCOUNT' => $this->recAccount,
            'EDP_AMOUNT'      => '15000.00',
            'EDP_BILL_NO'     => $this->order->uuid,
        ], $overrides);
    }

    public function test_successful_idram_callback_marks_order_paid(): void
    {
        Notification::fake();

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->confirmPayload()
        )
            ->assertOk()
            ->assertSee('OK');

        $this->order->refresh();
        $this->assertEquals(PaymentStatus::Paid, $this->order->payment_status);
        $this->assertEquals(OrderStatus::Processing, $this->order->status);
        $this->assertNotNull($this->order->paid_at);
        $this->assertEquals(TransactionStatus::Success, $this->transaction->fresh()->status);
    }

    public function test_successful_callback_sends_new_order_notification(): void
    {
        Notification::fake();

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->confirmPayload()
        )->assertOk();

        Notification::assertSentTo($this->store->owner, NewOrderNotification::class);
    }

    public function test_invalid_checksum_is_rejected_and_order_stays_pending(): void
    {
        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->confirmPayload(['EDP_CHECKSUM' => 'DEADBEEFDEADBEEFDEADBEEFDEADBEEF'])
        )->assertStatus(400);

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
            $this->confirmPayload()
        )
            ->assertOk()
            ->assertSee('OK');

        $this->assertEquals(PaymentStatus::Paid, $this->order->fresh()->payment_status);
    }

    public function test_callback_with_missing_bill_no_returns_422(): void
    {
        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            ['EDP_AMOUNT' => '15000.00']
        )->assertStatus(422);
    }

    public function test_precheck_with_matching_recipient_and_amount_returns_ok(): void
    {
        $response = $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload()
        );

        $response->assertOk()->assertSee('OK');
        $this->assertEquals(PaymentStatus::Pending, $this->order->fresh()->payment_status);
    }

    public function test_precheck_never_mutates_order_or_transaction(): void
    {
        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload()
        );

        $this->assertEquals(PaymentStatus::Pending, $this->order->fresh()->payment_status);
        $this->assertEquals(TransactionStatus::Pending, $this->transaction->fresh()->status);
    }

    public function test_precheck_with_wrong_recipient_account_is_rejected(): void
    {
        $response = $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload(['EDP_REC_ACCOUNT' => '999999999'])
        );

        $response->assertOk();
        $this->assertNotEquals('OK', trim($response->getContent()));
    }

    public function test_precheck_with_wrong_amount_is_rejected(): void
    {
        $response = $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload(['EDP_AMOUNT' => '500.00'])
        );

        $response->assertOk();
        $this->assertNotEquals('OK', trim($response->getContent()));
    }

    public function test_precheck_for_unknown_bill_no_is_rejected(): void
    {
        $response = $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $this->precheckPayload(['EDP_BILL_NO' => '550e8400-e29b-41d4-a716-446655449999'])
        );

        $response->assertOk();
        $this->assertNotEquals('OK', trim($response->getContent()));
    }
}
