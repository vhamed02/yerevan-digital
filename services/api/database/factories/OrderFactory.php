<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 1000, 50000);

        return [
            'store_id'        => Store::factory(),
            'customer_id'     => null,
            'status'          => OrderStatus::Pending,
            'payment_status'  => PaymentStatus::Pending,
            'subtotal'        => $subtotal,
            'discount'        => 0,
            'shipping_cost'   => 0,
            'tax'             => 0,
            'total'           => $subtotal,
            'currency'        => 'AMD',
            'customer_name'   => fake()->name(),
            'customer_email'  => fake()->safeEmail(),
            'customer_phone'  => fake()->phoneNumber(),
            'shipping_address'=> ['city' => 'Yerevan', 'address' => fake()->streetAddress()],
        ];
    }

    public function paid(): static
    {
        return $this->state([
            'status'         => OrderStatus::Paid,
            'payment_status' => PaymentStatus::Paid,
            'paid_at'        => now(),
        ]);
    }

    public function processing(): static
    {
        return $this->state([
            'status'         => OrderStatus::Processing,
            'payment_status' => PaymentStatus::Paid,
        ]);
    }
}
