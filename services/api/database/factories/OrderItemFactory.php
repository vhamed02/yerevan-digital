<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        $unitPrice  = fake()->randomFloat(2, 1000, 50000);
        $quantity   = fake()->numberBetween(1, 5);
        $name       = fake()->words(2, true);

        return [
            'order_id'     => Order::factory(),
            'product_id'   => null,
            'variant_id'   => null,
            'product_name' => ['hy' => $name, 'en' => $name],
            'variant_name' => null,
            'sku'          => strtoupper(fake()->bothify('??###')),
            'quantity'     => $quantity,
            'unit_price'   => $unitPrice,
            'total_price'  => $unitPrice * $quantity,
        ];
    }
}
