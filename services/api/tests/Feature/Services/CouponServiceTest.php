<?php

namespace Tests\Feature\Services;

use App\Models\Coupon;
use App\Services\CouponService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponServiceTest extends TestCase
{
    use RefreshDatabase;

    private CouponService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        $this->service = app(CouponService::class);
    }

    public function test_fixed_coupon_discounts_its_face_value(): void
    {
        $coupon = Coupon::factory()->create(['value' => 1500]);

        $this->assertSame('1500.00', $this->service->discountFor($coupon, '20000.00'));
    }

    public function test_percent_coupon_discounts_a_share_of_the_subtotal(): void
    {
        $coupon = Coupon::factory()->percent(10)->create();

        $this->assertSame('2000.00', $this->service->discountFor($coupon, '20000.00'));
    }

    public function test_percent_coupon_rounds_half_up(): void
    {
        // 100.10 * 5% = 5.005 exactly — a float would round this down.
        $coupon = Coupon::factory()->percent(5)->create();

        $this->assertSame('5.01', $this->service->discountFor($coupon, '100.10'));
    }

    public function test_percent_coupon_respects_its_maximum_discount(): void
    {
        $coupon = Coupon::factory()->percent(50)->create(['max_discount_amount' => 3000]);

        $this->assertSame('3000.00', $this->service->discountFor($coupon, '20000.00'));
    }

    public function test_a_fixed_coupon_never_discounts_more_than_the_order_is_worth(): void
    {
        $coupon = Coupon::factory()->create(['value' => 5000]);

        // Without the clamp this would make the order total negative.
        $this->assertSame('1200.00', $this->service->discountFor($coupon, '1200.00'));
    }

    public function test_lookup_is_case_insensitive(): void
    {
        $coupon = Coupon::factory()->create(['code' => 'SUMMER25']);

        $found = $this->service->findByCode($coupon->store_id, 'summer25');

        $this->assertNotNull($found);
        $this->assertSame($coupon->id, $found->id);
    }

    public function test_lookup_is_scoped_to_the_store(): void
    {
        $coupon = Coupon::factory()->create(['code' => 'SHARED']);

        $this->assertNull($this->service->findByCode($coupon->store_id + 1, 'SHARED'));
    }

    public function test_inactive_coupon_is_rejected(): void
    {
        $coupon = Coupon::factory()->create(['is_active' => false]);

        $this->assertSame(
            'This coupon is no longer active.',
            $this->service->reasonUnusable($coupon, '20000.00')
        );
    }

    public function test_expired_coupon_is_rejected(): void
    {
        $coupon = Coupon::factory()->expired()->create();

        $this->assertSame(
            'This coupon has expired.',
            $this->service->reasonUnusable($coupon, '20000.00')
        );
    }

    public function test_coupon_that_has_not_started_is_rejected(): void
    {
        $coupon = Coupon::factory()->create(['starts_at' => now()->addDay()]);

        $this->assertSame(
            'This coupon is not active yet.',
            $this->service->reasonUnusable($coupon, '20000.00')
        );
    }

    public function test_exhausted_coupon_is_rejected(): void
    {
        $coupon = Coupon::factory()->exhausted()->create();

        $this->assertSame(
            'This coupon has reached its usage limit.',
            $this->service->reasonUnusable($coupon, '20000.00')
        );
    }

    public function test_coupon_below_its_minimum_order_is_rejected(): void
    {
        $coupon = Coupon::factory()->create(['min_order_amount' => 10000]);

        $this->assertNotNull($this->service->reasonUnusable($coupon, '9999.99'));
        $this->assertNull($this->service->reasonUnusable($coupon, '10000.00'));
    }

    public function test_a_usable_coupon_has_no_objection(): void
    {
        $coupon = Coupon::factory()->create([
            'starts_at'   => now()->subDay(),
            'ends_at'     => now()->addDay(),
            'usage_limit' => 10,
            'used_count'  => 3,
        ]);

        $this->assertNull($this->service->reasonUnusable($coupon, '20000.00'));
    }
}
