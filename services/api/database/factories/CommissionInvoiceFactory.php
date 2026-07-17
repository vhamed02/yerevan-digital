<?php

namespace Database\Factories;

use App\Enums\InvoiceStatus;
use App\Models\CommissionInvoice;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommissionInvoiceFactory extends Factory
{
    protected $model = CommissionInvoice::class;

    public function definition(): array
    {
        $start = now()->startOfWeek()->subWeek();

        return [
            'store_id'     => Store::factory(),
            'status'       => InvoiceStatus::Pending,
            'period_start' => $start->toDateString(),
            'period_end'   => $start->copy()->addWeek()->toDateString(),
            'amount'       => fake()->randomFloat(2, 100, 5000),
            'currency'     => 'AMD',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status'             => InvoiceStatus::Paid,
            'paid_at'            => now(),
            'payment_reference'  => 'TC-PAY-' . fake()->numberBetween(1000, 9999),
            'external_invoice_id' => 'TC-INV-' . fake()->numberBetween(1000, 9999),
        ]);
    }

    public function void(): static
    {
        return $this->state(['status' => InvoiceStatus::Void]);
    }
}
