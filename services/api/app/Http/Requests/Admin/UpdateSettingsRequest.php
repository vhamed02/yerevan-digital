<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * `store_settings.value` is a string column, but JSON clients naturally send
     * booleans and numbers (registration_enabled, smtp_port). Canonicalise them
     * to strings here so callers don't have to stringify by hand, and so what
     * lands in the column is always '1'/'0' rather than 'true'/''/1.
     */
    protected function prepareForValidation(): void
    {
        $settings = $this->input('settings');

        if (! is_array($settings)) {
            return;
        }

        $this->merge([
            'settings' => collect($settings)->map(function ($value) {
                if (is_bool($value)) {
                    return $value ? '1' : '0';
                }

                // Anything non-scalar falls through and is caught by the string rule.
                return is_scalar($value) ? (string) $value : $value;
            })->all(),
        ]);
    }

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
