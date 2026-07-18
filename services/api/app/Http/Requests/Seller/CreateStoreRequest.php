<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateStoreRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'           => ['required', 'array'],
            'name.hy'        => ['required', 'string', 'max:255'],
            'name.en'        => ['required', 'string', 'max:255'],
            'name.ru'        => ['nullable', 'string', 'max:255'],
            // A store is served at <slug>.yerevan.digital, so the slug must not
            // collide with a reserved/platform subdomain (www, api, …).
            'slug'           => ['required', 'string', 'max:100', 'unique:stores,slug', 'regex:/^[a-z0-9-]+$/', Rule::notIn(config('domains.reserved_subdomains', []))],
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
