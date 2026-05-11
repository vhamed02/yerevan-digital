<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTemplateConfigRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'primary_color'        => ['nullable', 'string', 'max:20'],
            'secondary_color'      => ['nullable', 'string', 'max:20'],
            'font_pair'            => ['nullable', 'string', 'max:100'],
            'layout_columns'       => ['nullable', 'integer', 'in:1,2,3,4'],
            'show_hero'            => ['nullable', 'boolean'],
            'show_categories_bar'  => ['nullable', 'boolean'],
        ];
    }
}
