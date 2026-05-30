<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryRequest extends FormRequest
{
    public function rules(): array
    {
        $id = $this->route('category')?->id ?? $this->route('category');

        return [
            'name'       => ['sometimes', 'array'],
            'name.hy'    => ['required_with:name', 'string', 'max:255'],
            'name.en'    => ['required_with:name', 'string', 'max:255'],
            'name.ru'    => ['nullable', 'string', 'max:255'],
            'slug'       => ['sometimes', 'string', 'max:100', "unique:categories,slug,{$id}"],
            'parent_id'  => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'icon'       => ['sometimes', 'nullable', 'string', 'max:50'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active'  => ['sometimes', 'boolean'],
        ];
    }
}
