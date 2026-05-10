<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreTemplateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'key'               => ['required', 'string', 'max:50', 'unique:store_templates,key', 'regex:/^[a-z0-9_-]+$/'],
            'name'              => ['required', 'array'],
            'name.hy'           => ['required', 'string', 'max:255'],
            'name.en'           => ['required', 'string', 'max:255'],
            'description'       => ['nullable', 'array'],
            'description.hy'    => ['nullable', 'string'],
            'description.en'    => ['nullable', 'string'],
            'sort_order'        => ['nullable', 'integer', 'min:0'],
        ];
    }
}
