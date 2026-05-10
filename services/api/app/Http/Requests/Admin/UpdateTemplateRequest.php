<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTemplateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'           => ['sometimes', 'array'],
            'name.hy'        => ['required_with:name', 'string', 'max:255'],
            'name.en'        => ['required_with:name', 'string', 'max:255'],
            'description'    => ['sometimes', 'nullable', 'array'],
            'description.hy' => ['nullable', 'string'],
            'description.en' => ['nullable', 'string'],
            'sort_order'     => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
