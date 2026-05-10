<?php

namespace Database\Factories;

use App\Models\PaymentGateway;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentGatewayFactory extends Factory
{
    protected $model = PaymentGateway::class;

    public function definition(): array
    {
        $name = Str::slug(fake()->word()) . '_' . Str::random(4);

        return [
            'name'                 => $name,
            'display_name'         => ['hy' => fake()->company(), 'en' => fake()->company()],
            'description'          => ['hy' => null, 'en' => null],
            'is_active'            => true,
            'is_sandbox_available' => true,
            'required_fields'      => [
                ['key' => 'api_key', 'label' => 'API Key', 'type' => 'text'],
            ],
            'sort_order'           => 0,
        ];
    }
}
