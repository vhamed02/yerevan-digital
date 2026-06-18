<?php

namespace App\Http\Requests\Store;

use Illuminate\Foundation\Http\FormRequest;

class TrackOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_number' => ['required', 'string', 'max:50'],
            'email'        => ['required', 'email', 'max:255'],
        ];
    }
}
