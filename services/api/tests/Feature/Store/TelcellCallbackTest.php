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

class TelcellCallbackTest extends TestCase
{
    use RefreshDatabase;

    private const CURRENCY = '֏';

    private Store          $store;
    private Order          $order;
    private Transaction    $transaction;
    private PaymentGateway $gateway;
    private string         $shopKey = 'telcell_secret_key_123';
    private string         $issuer  = 'shop@yerevan.digital';

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
            'name'      => 'telcell',
            'is_active' => true,
        ]);

        StorePaymentGateway::create([
            'store_id'           => $this->store->id,
            'payment_gateway_id' => $this->gateway->id,
            'is_enabled'         => true,
            'is_sandbox'         => false,
            'credentials'        => ['issuer' => $this->issuer, 'shop_key' => $this->shopKey],
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

    private function callbackPayload(array $overrides = []): array
    {
        $data = array_merge([
            'invoice'    => 'TC-INV-' . rand(1000, 9999),
            'issuer_id'  => base64_encode($this->order->uuid),
            'payment_id' => 'TC-PAY-' . rand(1000, 9999),
            'currency'   => self::CURRENCY,
            'sum'        => '15000',
            'time'       => '2026-07-17 12:30:00',
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

    public function test_successful_telcell_callback_marks_order_paid(): void
    {
        Notification::fake();

        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/telcell",
            $this->callbackPayload()
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
            "/api/v1/store/{$this->store->slug}/payments/callback/telcell",
            $this->callbackPayload()
        )->assertOk();

        Notification::assertSentTo($this->store->owner, NewOrderNotification::class);
    }

    public function test_invalid_checksum_is_rejected_and_order_stays_pending(): void
    {
        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/telcell",
            $this->callbackPayload(['checksum' => 'deadbeefdeadbeefdeadbeefdeadbeef'])
        )->assertStatus(400);

        $this->assertEquals(PaymentStatus::Pending, $this->order->fresh()->payment_status);
    }

    public function test_rejected_status_is_acknowledged_with_200_but_not_paid(): void
    {
        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/telcell",
            $this->callbackPayload(['status' => 'REJECTED'])
        )
            ->assertOk()
            ->assertSee('OK');

        $this->assertEquals(PaymentStatus::Pending, $this->order->fresh()->payment_status);
        $this->assertEquals(TransactionStatus::Failed, $this->transaction->fresh()->status);
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
            "/api/v1/store/{$this->store->slug}/payments/callback/telcell",
            $this->callbackPayload()
        )
            ->assertOk()
            ->assertSee('OK');

        $this->assertEquals(PaymentStatus::Paid, $this->order->fresh()->payment_status);
    }

    public function test_callback_with_missing_issuer_id_returns_422(): void
    {
        $this->postJson(
            "/api/v1/store/{$this->store->slug}/payments/callback/telcell",
            ['sum' => '15000', 'status' => 'PAID']
        )->assertStatus(422);
    }
}
