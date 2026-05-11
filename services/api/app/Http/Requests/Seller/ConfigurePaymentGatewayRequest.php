<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class ConfigurePaymentGatewayRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'payment_gateway_id' => ['required', 'integer', 'exists:payment_gateways,id'],
            'is_enabled'         => ['required', 'boolean'],
            'is_sandbox'         => ['required', 'boolean'],
            'credentials'        => ['required', 'array'],
        ];
    }
}
