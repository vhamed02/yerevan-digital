<?php

namespace App\Http\Requests\Seller;

use App\Enums\ProductStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'                    => ['sometimes', 'array'],
            'name.hy'                 => ['required_with:name', 'string', 'max:255'],
            'name.en'                 => ['required_with:name', 'string', 'max:255'],
            'name.ru'                 => ['nullable', 'string', 'max:255'],
            'description'             => ['sometimes', 'nullable', 'array'],
            'description.hy'          => ['nullable', 'string'],
            'description.en'          => ['nullable', 'string'],
            'description.ru'          => ['nullable', 'string'],
            'short_description'       => ['sometimes', 'nullable', 'array'],
            'short_description.hy'    => ['nullable', 'string'],
            'short_description.en'    => ['nullable', 'string'],
            'short_description.ru'    => ['nullable', 'string'],
            'category_id'             => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'price'                   => ['sometimes', 'numeric', 'min:0'],
            'compare_price'           => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'cost_price'              => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'sku'                     => ['sometimes', 'nullable', 'string', 'max:100'],
            'stock'                   => ['sometimes', 'integer', 'min:0'],
            'manage_stock'            => ['sometimes', 'boolean'],
            'allow_backorders'        => ['sometimes', 'boolean'],
            'weight'                  => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'status'                  => ['sometimes', Rule::enum(ProductStatus::class)],
            'is_featured'             => ['sometimes', 'boolean'],
            'sort_order'              => ['sometimes', 'integer', 'min:0'],
            'meta_title'              => ['sometimes', 'nullable', 'array'],
            'meta_title.hy'           => ['nullable', 'string', 'max:255'],
            'meta_title.en'           => ['nullable', 'string', 'max:255'],
            'meta_title.ru'           => ['nullable', 'string', 'max:255'],
            'meta_description'        => ['sometimes', 'nullable', 'array'],
            'meta_description.hy'     => ['nullable', 'string'],
            'meta_description.en'     => ['nullable', 'string'],
            'meta_description.ru'     => ['nullable', 'string'],
        ];
    }
}
