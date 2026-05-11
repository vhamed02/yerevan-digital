<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTemplateActiveRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'template_key' => ['required', 'string', 'exists:store_templates,key'],
        ];
    }
}
