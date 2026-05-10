<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'settings'       => ['required', 'array'],
            'settings.*'     => ['nullable', 'string', 'max:1000'],
        ];
    }
}
