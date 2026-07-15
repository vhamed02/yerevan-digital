<?php

namespace App\Http\Requests\Store;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'items'              => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.quantity'   => ['required', 'integer', 'min:1', 'max:100'],
            'full_name'          => ['required', 'string', 'max:255'],
            'email'              => ['required', 'email'],
            'phone'              => ['nullable', 'string', 'max:30'],
            'address'            => ['required', 'string', 'max:500'],
            'city'               => ['required', 'string', 'max:100'],
            'postal_code'        => ['nullable', 'string', 'max:20'],
            'country'            => ['required', 'string', 'max:100'],
            'notes'              => ['nullable', 'string', 'max:500'],
            'payment_method'     => ['required', 'string'],
            'coupon_code'        => ['nullable', 'string', 'max:50'],
        ];
    }
}
