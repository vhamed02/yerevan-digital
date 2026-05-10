<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        $name = fake()->words(2, true);

        return [
            'parent_id'  => null,
            'name'       => ['hy' => $name, 'en' => $name],
            'slug'       => Str::slug($name) . '-' . Str::random(4),
            'sort_order' => 0,
            'is_active'  => true,
        ];
    }
}
