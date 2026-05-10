<?php

namespace Database\Factories;

use App\Enums\StoreStatus;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class StoreFactory extends Factory
{
    protected $model = Store::class;

    public function definition(): array
    {
        $name = fake()->company();

        return [
            'user_id'      => User::factory(),
            'name'         => ['hy' => $name, 'en' => $name],
            'slug'         => Str::slug($name) . '-' . Str::random(4),
            'description'  => ['hy' => fake()->sentence(), 'en' => fake()->sentence()],
            'status'       => StoreStatus::Active,
            'currency'     => 'AMD',
            'is_featured'  => false,
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => StoreStatus::Pending]);
    }

    public function suspended(): static
    {
        return $this->state(['status' => StoreStatus::Suspended]);
    }

    public function featured(): static
    {
        return $this->state(['is_featured' => true]);
    }
}
