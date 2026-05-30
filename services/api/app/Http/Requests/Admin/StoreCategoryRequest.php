<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'            => ['required', 'array'],
            'name.hy'         => ['required', 'string', 'max:255'],
            'name.en'         => ['required', 'string', 'max:255'],
            'name.ru'         => ['nullable', 'string', 'max:255'],
            'slug'            => ['nullable', 'string', 'max:100', 'unique:categories,slug'],
            'parent_id'       => ['nullable', 'integer', 'exists:categories,id'],
            'icon'            => ['nullable', 'string', 'max:50'],
            'sort_order'      => ['nullable', 'integer', 'min:0'],
            'is_active'       => ['nullable', 'boolean'],
        ];
    }
}
