<?php

namespace App\Http\Requests\Seller;

use App\Enums\CouponType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreCouponRequest extends FormRequest
{
    /**
     * Codes are stored uppercase, so normalise before the unique rule runs —
     * otherwise "sale10" passes validation against an existing "SALE10" and
     * then trips the database constraint.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge(['code' => strtoupper(trim((string) $this->input('code')))]);
        }
    }

    public function rules(): array
    {
        $storeId  = $this->attributes->get('sellerStore')?->id;
        $couponId = $this->route('uuid');

        return [
            'code' => [
                $this->isMethod('POST') ? 'required' : 'sometimes',
                'string',
                'max:50',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('coupons', 'code')
                    ->where(fn ($q) => $q->where('store_id', $storeId)->whereNull('deleted_at'))
                    ->ignore($couponId, 'uuid'),
            ],
            'type'  => [$this->isMethod('POST') ? 'required' : 'sometimes', Rule::enum(CouponType::class)],
            'value' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'numeric', 'min:0'],
            'min_order_amount'    => ['sometimes', 'numeric', 'min:0'],
            'max_discount_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'usage_limit'         => ['sometimes', 'nullable', 'integer', 'min:1'],
            'starts_at'           => ['sometimes', 'nullable', 'date'],
            'ends_at'             => ['sometimes', 'nullable', 'date', 'after:starts_at'],
            'is_active'           => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            // A percent coupon is a rate, not an amount — 150% off is a mistake,
            // and the checkout clamp would silently hide it.
            if ($this->input('type') === CouponType::Percent->value
                && (float) $this->input('value') > 100) {
                $validator->errors()->add('value', 'A percentage coupon cannot exceed 100.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'code.regex'  => 'The code may only contain letters, numbers, hyphens and underscores.',
            'code.unique' => 'You already have a coupon with this code.',
        ];
    }
}
