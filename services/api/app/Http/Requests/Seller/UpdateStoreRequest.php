<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStoreRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'                  => ['sometimes', 'array'],
            'name.hy'               => ['required_with:name', 'string', 'max:255'],
            'name.en'               => ['required_with:name', 'string', 'max:255'],
            'name.ru'               => ['nullable', 'string', 'max:255'],
            'description'           => ['sometimes', 'nullable', 'array'],
            'description.hy'        => ['nullable', 'string'],
            'description.en'        => ['nullable', 'string'],
            'description.ru'        => ['nullable', 'string'],
            'phone'                 => ['sometimes', 'nullable', 'string', 'max:50'],
            'email'                 => ['sometimes', 'nullable', 'email', 'max:255'],
            'address'               => ['sometimes', 'nullable', 'string', 'max:500'],
            'social_links'          => ['sometimes', 'nullable', 'array'],
            'social_links.*'        => ['nullable', 'string', 'max:255'],
            'meta_title'            => ['sometimes', 'nullable', 'array'],
            'meta_title.hy'         => ['nullable', 'string', 'max:255'],
            'meta_title.en'         => ['nullable', 'string', 'max:255'],
            'meta_title.ru'         => ['nullable', 'string', 'max:255'],
            'meta_description'      => ['sometimes', 'nullable', 'array'],
            'meta_description.hy'   => ['nullable', 'string'],
            'meta_description.en'   => ['nullable', 'string'],
            'meta_description.ru'   => ['nullable', 'string'],
        ];
    }
}
