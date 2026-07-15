<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommissionRateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            // Decimal fraction: 0.05 = 5%. Explicit null clears the per-store
            // override and returns the store to the platform default rate.
            'commission_rate' => ['present', 'nullable', 'numeric', 'min:0', 'max:1'],
        ];
    }
}
