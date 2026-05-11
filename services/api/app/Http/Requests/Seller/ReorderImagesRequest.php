<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class ReorderImagesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'order'   => ['required', 'array', 'min:1'],
            'order.*' => ['required', 'integer'],
        ];
    }
}
