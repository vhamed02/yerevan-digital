<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class StoreShippingZoneRequest extends FormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name'       => [$required, 'array'],
            'name.hy'    => ['required_with:name', 'string', 'max:255'],
            'name.en'    => ['required_with:name', 'string', 'max:255'],
            'name.ru'    => ['nullable', 'string', 'max:255'],
            'cities'     => ['sometimes', 'array'],
            'cities.*'   => ['string', 'max:100'],
            'rate'       => [$required, 'numeric', 'min:0'],
            'free_over'  => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active'  => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
