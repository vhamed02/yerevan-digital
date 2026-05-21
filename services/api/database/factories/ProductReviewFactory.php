<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductReview;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductReviewFactory extends Factory
{
    protected $model = ProductReview::class;

    public function definition(): array
    {
        return [
            'store_id'       => Store::factory(),
            'product_id'     => Product::factory(),
            'reviewer_name'  => fake()->name(),
            'reviewer_email' => fake()->safeEmail(),
            'rating'         => fake()->numberBetween(1, 5),
            'body'           => fake()->sentence(),
            'is_approved'    => false,
        ];
    }

    public function approved(): static
    {
        return $this->state(['is_approved' => true]);
    }

    public function anonymous(): static
    {
        return $this->state(['reviewer_email' => null]);
    }
}
