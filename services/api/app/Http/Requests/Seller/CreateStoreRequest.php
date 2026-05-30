<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class CreateStoreRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'           => ['required', 'array'],
            'name.hy'        => ['required', 'string', 'max:255'],
            'name.en'        => ['required', 'string', 'max:255'],
            'name.ru'        => ['nullable', 'string', 'max:255'],
            'slug'           => ['required', 'string', 'max:100', 'unique:stores,slug', 'regex:/^[a-z0-9-]+$/'],
            'description'    => ['nullable', 'array'],
            'description.hy' => ['nullable', 'string'],
            'description.en' => ['nullable', 'string'],
            'description.ru' => ['nullable', 'string'],
            'phone'          => ['nullable', 'string', 'max:50'],
            'email'          => ['nullable', 'email', 'max:255'],
            'address'        => ['nullable', 'string', 'max:500'],
        ];
    }
}
