<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReorderCategoryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'order'   => ['required', 'array', 'min:1'],
            'order.*' => ['required', 'integer', 'exists:categories,id'],
        ];
    }
}
