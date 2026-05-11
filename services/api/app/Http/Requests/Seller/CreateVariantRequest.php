<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class CreateVariantRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'             => ['required', 'array'],
            'name.hy'          => ['required', 'string', 'max:255'],
            'name.en'          => ['required', 'string', 'max:255'],
            'sku'              => ['nullable', 'string', 'max:100'],
            'price'            => ['nullable', 'numeric', 'min:0'],
            'stock'            => ['required', 'integer', 'min:0'],
            'attributes'       => ['nullable', 'array'],
            'attributes.*'     => ['nullable', 'string'],
            'image'            => ['nullable', 'string', 'max:500'],
            'is_active'        => ['nullable', 'boolean'],
        ];
    }
}
