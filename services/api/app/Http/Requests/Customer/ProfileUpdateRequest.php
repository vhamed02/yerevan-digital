<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'   => ['required', 'string', 'max:255'],
            'phone'  => ['nullable', 'string', 'max:50'],
            'locale' => ['nullable', Rule::in(config('app.supported_locales'))],
        ];
    }
}
