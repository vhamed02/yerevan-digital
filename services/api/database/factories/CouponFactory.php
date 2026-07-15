<?php

namespace Database\Factories;

use App\Enums\CouponType;
use App\Models\Coupon;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        return [
            'store_id'            => Store::factory(),
            'code'                => strtoupper(fake()->unique()->bothify('SAVE##??')),
            'type'                => CouponType::Fixed,
            'value'               => 1000,
            'min_order_amount'    => 0,
            'max_discount_amount' => null,
            'usage_limit'         => null,
            'used_count'          => 0,
            'starts_at'           => null,
            'ends_at'             => null,
            'is_active'           => true,
        ];
    }

    public function percent(float $value = 10): static
    {
        return $this->state(['type' => CouponType::Percent, 'value' => $value]);
    }

    public function expired(): static
    {
        return $this->state([
            'starts_at' => now()->subDays(10),
            'ends_at'   => now()->subDay(),
        ]);
    }

    public function exhausted(): static
    {
        return $this->state(['usage_limit' => 5, 'used_count' => 5]);
    }
}
