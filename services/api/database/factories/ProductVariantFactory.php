<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        $name = fake()->word();

        return [
            'product_id' => Product::factory(),
            'name'       => ['hy' => $name, 'en' => $name],
            'sku'        => strtoupper(fake()->bothify('??###')),
            'price'      => fake()->randomFloat(2, 1000, 30000),
            'stock'      => fake()->numberBetween(0, 50),
            'attributes' => ['Size' => fake()->randomElement(['S', 'M', 'L', 'XL'])],
            'is_active'  => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
