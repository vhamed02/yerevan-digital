<?php

namespace Database\Factories;

use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->words(3, true);

        return [
            'store_id'    => Store::factory(),
            'name'        => ['hy' => $name, 'en' => $name],
            'slug'        => Str::slug($name) . '-' . Str::random(4),
            'price'       => fake()->randomFloat(2, 500, 50000),
            'stock'       => fake()->numberBetween(0, 100),
            'status'      => ProductStatus::Active,
            'manage_stock'=> true,
            'is_featured' => false,
            'sort_order'  => 0,
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => ProductStatus::Draft]);
    }

    public function archived(): static
    {
        return $this->state(['status' => ProductStatus::Archived]);
    }
}
