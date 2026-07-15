<?php

namespace Database\Factories;

use App\Models\ShippingZone;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShippingZoneFactory extends Factory
{
    protected $model = ShippingZone::class;

    public function definition(): array
    {
        return [
            'store_id'   => Store::factory(),
            'name'       => ['hy' => 'Երևան', 'en' => 'Yerevan'],
            'cities'     => ['Yerevan'],
            'rate'       => 1000,
            'free_over'  => null,
            'is_default' => false,
            'is_active'  => true,
            'sort_order' => 0,
        ];
    }

    /** Catch-all zone for cities no other zone lists. */
    public function fallback(): static
    {
        return $this->state([
            'name'       => ['hy' => 'Մարզեր', 'en' => 'Regions'],
            'cities'     => [],
            'rate'       => 2500,
            'is_default' => true,
            'sort_order' => 99,
        ]);
    }
}
