<?php

namespace Database\Factories;

use App\Enums\CommissionType;
use App\Models\Commission;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommissionFactory extends Factory
{
    protected $model = Commission::class;

    public function definition(): array
    {
        $base = fake()->randomFloat(2, 1000, 50000);
        $rate = '0.0500';

        return [
            'store_id'    => Store::factory(),
            'order_id'    => Order::factory(),
            'type'        => CommissionType::Accrual,
            'rate'        => $rate,
            'base_amount' => $base,
            'amount'      => round($base * (float) $rate, 2),
            'currency'    => 'AMD',
            'reason'      => null,
        ];
    }

    public function reversal(): static
    {
        return $this->state(fn (array $attributes) => [
            'type'   => CommissionType::Reversal,
            'amount' => -1 * abs((float) $attributes['amount']),
            'reason' => 'order_cancelled',
        ]);
    }
}
