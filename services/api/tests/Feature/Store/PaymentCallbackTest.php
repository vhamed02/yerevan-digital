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
            'credentials'        => ['secret_key' => $this->secretKey, 'edp_id' => $this->edpId],
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

    private function buildIdramChecksum(string $amount, string $orderUuid, string $transId): string
    {
        return strtoupper(md5(
            $this->secretKey . ':' . $this->edpId . ':' . $amount . ':' . $orderUuid . ':' . $transId
        ));
    }

    private function idramCallbackPayload(array $overrides = []): array
    {
        $transId  = 'TXN-' . rand(1000, 9999);
        $amount   = '15000.00';
        $checksum = $this->buildIdramChecksum($amount, $this->order->uuid, $transId);

        return array_merge([
            'EDP_BILL_NO'     => $this->order->uuid,
            'EDP_REC_ACCOUNT' => $this->edpId,
            'EDP_AMOUNT'      => $amount,
            'EDP_TRANS_ID'    => $transId,
            'EDP_CHECKSUM'    => $checksum,
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

    public function test_callback_with_invalid_checksum_marks_transaction_failed(): void
    {
        $payload = $this->idramCallbackPayload(['EDP_CHECKSUM' => 'INVALID_CHECKSUM']);

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/idram",
            $payload
        )->assertOk();

        $this->assertEquals(TransactionStatus::Failed, $this->transaction->fresh()->status);
        $this->assertEquals(PaymentStatus::Pending, $this->order->fresh()->payment_status);
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
}
