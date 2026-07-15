<?php

namespace Tests\Feature\Store;

use App\Actions\HandlePaymentSuccessAction;
use App\Enums\ProductStatus;
use App\Enums\StoreStatus;
use App\Models\Commission;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\ShippingZone;
use App\Models\Store;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutDiscountShippingTest extends TestCase
{
    use RefreshDatabase;

    private Store   $store;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        config(['commission.default_rate' => '0.05']);

        $this->store = Store::factory()->create(['status' => StoreStatus::Active]);
        $this->product = Product::factory()->create([
            'store_id'     => $this->store->id,
            'status'       => ProductStatus::Active,
            'price'        => 10000,
            'manage_stock' => false,
        ]);
    }

    private function checkout(array $overrides = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson("/api/v1/store/{$this->store->slug}/checkout", [
            'items'          => [['product_id' => $this->product->uuid, 'quantity' => 2]],
            'full_name'      => 'Ani Petrosyan',
            'email'          => 'ani@example.am',
            'phone'          => '+37411223344',
            'address'        => '12 Abovyan St',
            'city'           => 'Yerevan',
            'country'        => 'Armenia',
            'payment_method' => 'cod',
            ...$overrides,
        ]);
    }

    public function test_checkout_without_a_coupon_or_zones_totals_the_subtotal(): void
    {
        $this->checkout()
            ->assertCreated()
            ->assertJsonPath('data.subtotal', 20000)
            ->assertJsonPath('data.discount', 0)
            ->assertJsonPath('data.shipping_cost', 0)
            ->assertJsonPath('data.total', 20000);
    }

    public function test_a_fixed_coupon_reduces_the_total_and_is_recorded_on_the_order(): void
    {
        Coupon::factory()->create([
            'store_id' => $this->store->id,
            'code'     => 'SAVE5K',
            'value'    => 5000,
        ]);

        $this->checkout(['coupon_code' => 'save5k'])
            ->assertCreated()
            ->assertJsonPath('data.discount', 5000)
            ->assertJsonPath('data.total', 15000)
            ->assertJsonPath('data.coupon_code', 'SAVE5K');
    }

    public function test_shipping_is_added_on_top_of_the_discounted_subtotal(): void
    {
        Coupon::factory()->create(['store_id' => $this->store->id, 'code' => 'SAVE5K', 'value' => 5000]);
        ShippingZone::factory()->create(['store_id' => $this->store->id, 'rate' => 1000]);

        // 20000 - 5000 + 1000
        $this->checkout(['coupon_code' => 'SAVE5K'])
            ->assertCreated()
            ->assertJsonPath('data.shipping_cost', 1000)
            ->assertJsonPath('data.total', 16000);
    }

    public function test_redeeming_a_coupon_increments_its_usage(): void
    {
        $coupon = Coupon::factory()->create([
            'store_id'    => $this->store->id,
            'code'        => 'ONCE',
            'usage_limit' => 1,
        ]);

        $this->checkout(['coupon_code' => 'ONCE'])->assertCreated();
        $this->assertSame(1, $coupon->fresh()->used_count);

        // The limit is now spent, so a second checkout must be refused.
        $this->checkout(['coupon_code' => 'ONCE'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('coupon_code');
    }

    public function test_an_unknown_coupon_code_is_rejected(): void
    {
        $this->checkout(['coupon_code' => 'NOPE'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('coupon_code');
    }

    public function test_a_coupon_from_another_store_is_rejected(): void
    {
        Coupon::factory()->create(['code' => 'OTHERS']);

        $this->checkout(['coupon_code' => 'OTHERS'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('coupon_code');
    }

    public function test_a_coupon_below_its_minimum_order_is_rejected_at_checkout(): void
    {
        Coupon::factory()->create([
            'store_id'         => $this->store->id,
            'code'             => 'BIGSPEND',
            'min_order_amount' => 50000,
        ]);

        $this->checkout(['coupon_code' => 'BIGSPEND'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('coupon_code');
    }

    public function test_commission_is_charged_on_the_discounted_subtotal_not_on_shipping(): void
    {
        Coupon::factory()->create(['store_id' => $this->store->id, 'code' => 'SAVE5K', 'value' => 5000]);
        ShippingZone::factory()->create(['store_id' => $this->store->id, 'rate' => 1000]);

        $uuid  = $this->checkout(['coupon_code' => 'SAVE5K'])->assertCreated()->json('data.uuid');
        $order = \App\Models\Order::where('uuid', $uuid)->sole();

        app(HandlePaymentSuccessAction::class)->execute($order, 'cod');

        // Base is 20000 - 5000 = 15000; the 1000 shipping is excluded. 5% = 750.
        $commission = Commission::where('order_id', $order->id)->sole();
        $this->assertSame('15000.00', $commission->base_amount);
        $this->assertSame('750.00', $commission->amount);
    }
}
