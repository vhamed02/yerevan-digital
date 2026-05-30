<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVariantRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'         => ['sometimes', 'array'],
            'name.hy'      => ['required_with:name', 'string', 'max:255'],
            'name.en'      => ['required_with:name', 'string', 'max:255'],
            'name.ru'      => ['nullable', 'string', 'max:255'],
            'sku'          => ['sometimes', 'nullable', 'string', 'max:100'],
            'price'        => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'stock'        => ['sometimes', 'integer', 'min:0'],
            'attributes'   => ['sometimes', 'nullable', 'array'],
            'attributes.*' => ['nullable', 'string'],
            'image'        => ['sometimes', 'nullable', 'string', 'max:500'],
            'is_active'    => ['sometimes', 'boolean'],
        ];
    }
}
