<?php

namespace Database\Factories;

use App\Models\StoreTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class StoreTemplateFactory extends Factory
{
    protected $model = StoreTemplate::class;

    public function definition(): array
    {
        $name = fake()->word();

        return [
            'key'         => Str::slug($name) . '-' . Str::random(4),
            'name'        => ['hy' => $name, 'en' => $name],
            'description' => ['hy' => fake()->sentence(), 'en' => fake()->sentence()],
            'is_active'   => true,
            'sort_order'  => 0,
        ];
    }
}
