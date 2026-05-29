<?php

namespace Tests\Feature\Actions;

use App\Actions\CreateOrderAction;
use App\Data\CheckoutData;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Enums\StoreStatus;
use App\Events\OrderCreated;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CreateOrderActionTest extends TestCase
{
    use RefreshDatabase;

    private Store          $store;
    private Product        $product;
    private CreateOrderAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->store = Store::factory()->create(['status' => StoreStatus::Active]);
        $this->product = Product::factory()->create([
            'store_id'     => $this->store->id,
            'status'       => ProductStatus::Active,
            'price'        => 15000,
            'stock'        => 10,
            'manage_stock' => true,
        ]);

        $this->action = app(CreateOrderAction::class);
    }

    private function data(array $items = [], array $merge = []): CheckoutData
    {
        return new CheckoutData(
            storeId:         $this->store->id,
            items:           $items ?: [['product_id' => $this->product->uuid, 'variant_id' => null, 'quantity' => 2]],
            customerName:    $merge['customerName']    ?? 'Test Customer',
            customerEmail:   $merge['customerEmail']   ?? 'test@example.com',
            customerPhone:   $merge['customerPhone']   ?? null,
            shippingAddress: $merge['shippingAddress'] ?? ['city' => 'Yerevan', 'address' => 'Test Ave 1', 'country' => 'Armenia'],
            notes:           $merge['notes']           ?? null,
            paymentMethod:   $merge['paymentMethod']   ?? 'idram',
        );
    }

    public function test_creates_order_with_correct_total(): void
    {
        $order = $this->action->execute($this->data());

        $this->assertEquals(30000, $order->total);
        $this->assertEquals(OrderStatus::Pending, $order->status);
        $this->assertEquals(PaymentStatus::Pending, $order->payment_status);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'total' => 30000]);
    }

    public function test_creates_order_items_with_correct_fields(): void
    {
        $order = $this->action->execute($this->data(
            [['product_id' => $this->product->uuid, 'variant_id' => null, 'quantity' => 3]]
        ));

        $this->assertCount(1, $order->items);
        $item = $order->items->first();
        $this->assertEquals(3, $item->quantity);
        $this->assertEquals(15000, $item->unit_price);
        $this->assertEquals(45000, $item->total_price);
    }

    public function test_decrements_stock_for_managed_product(): void
    {
        $this->action->execute($this->data(
            [['product_id' => $this->product->uuid, 'variant_id' => null, 'quantity' => 3]]
        ));

        $this->assertEquals(7, $this->product->fresh()->stock);
    }

    public function test_does_not_decrement_stock_for_unmanaged_product(): void
    {
        $unmanaged = Product::factory()->create([
            'store_id'     => $this->store->id,
            'status'       => ProductStatus::Active,
            'price'        => 5000,
            'stock'        => 0,
            'manage_stock' => false,
        ]);

        $order = $this->action->execute($this->data(
            [['product_id' => $unmanaged->uuid, 'variant_id' => null, 'quantity' => 10]]
        ));

        $this->assertEquals(50000, $order->total);
        $this->assertEquals(0, $unmanaged->fresh()->stock);
    }

    public function test_throws_validation_exception_on_insufficient_stock(): void
    {
        $this->expectException(ValidationException::class);

        $this->action->execute($this->data(
            [['product_id' => $this->product->uuid, 'variant_id' => null, 'quantity' => 99]]
        ));
    }

    public function test_stock_unchanged_after_failed_checkout(): void
    {
        try {
            $this->action->execute($this->data(
                [['product_id' => $this->product->uuid, 'variant_id' => null, 'quantity' => 99]]
            ));
        } catch (ValidationException) {
        }

        $this->assertEquals(10, $this->product->fresh()->stock);
    }

    public function test_transaction_rolls_back_when_second_item_fails(): void
    {
        $lowStock = Product::factory()->create([
            'store_id'     => $this->store->id,
            'status'       => ProductStatus::Active,
            'stock'        => 1,
            'manage_stock' => true,
        ]);

        $initialCount = Order::count();

        try {
            $this->action->execute($this->data([
                ['product_id' => $this->product->uuid, 'variant_id' => null, 'quantity' => 2],
                ['product_id' => $lowStock->uuid,      'variant_id' => null, 'quantity' => 99],
            ]));
        } catch (ValidationException) {
        }

        $this->assertEquals($initialCount, Order::count());
        $this->assertEquals(10, $this->product->fresh()->stock);
    }

    public function test_fires_order_created_event(): void
    {
        Event::fake([OrderCreated::class]);

        $order = $this->action->execute($this->data());

        Event::assertDispatched(OrderCreated::class, fn($e) => $e->order->id === $order->id);
    }
}
