<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'settings'   => ['required', 'array'],
            'settings.*' => ['nullable', 'string', 'max:1000'],
            // Decimal fraction (0.05 = 5%). CommissionService ignores an
            // out-of-range value, but reject it here so it never gets stored.
            'settings.commission_rate' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:1'],
        ];
    }
}
