<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentGatewayRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'display_name'          => ['sometimes', 'array'],
            'display_name.hy'       => ['required_with:display_name', 'string', 'max:255'],
            'display_name.en'       => ['required_with:display_name', 'string', 'max:255'],
            'description'           => ['sometimes', 'nullable', 'array'],
            'description.hy'        => ['nullable', 'string'],
            'description.en'        => ['nullable', 'string'],
            'instructions'          => ['sometimes', 'nullable', 'array'],
            'instructions.hy'       => ['nullable', 'string'],
            'instructions.en'       => ['nullable', 'string'],
            'required_fields'       => ['sometimes', 'array'],
            'required_fields.*.key'   => ['required_with:required_fields', 'string'],
            'required_fields.*.label' => ['required_with:required_fields', 'string'],
            'required_fields.*.type'  => ['required_with:required_fields', 'string'],
            'sort_order'            => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
