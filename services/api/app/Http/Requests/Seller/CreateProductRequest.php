<?php

namespace App\Http\Requests\Seller;

use App\Enums\ProductStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateProductRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'                    => ['required', 'array'],
            'name.hy'                 => ['required', 'string', 'max:255'],
            'name.en'                 => ['required', 'string', 'max:255'],
            'slug'                    => ['nullable', 'string', 'max:255'],
            'description'             => ['nullable', 'array'],
            'description.hy'          => ['nullable', 'string'],
            'description.en'          => ['nullable', 'string'],
            'short_description'       => ['nullable', 'array'],
            'short_description.hy'    => ['nullable', 'string'],
            'short_description.en'    => ['nullable', 'string'],
            'category_id'             => ['nullable', 'integer', 'exists:categories,id'],
            'price'                   => ['required', 'numeric', 'min:0'],
            'compare_price'           => ['nullable', 'numeric', 'min:0'],
            'cost_price'              => ['nullable', 'numeric', 'min:0'],
            'sku'                     => ['nullable', 'string', 'max:100'],
            'stock'                   => ['nullable', 'integer', 'min:0'],
            'manage_stock'            => ['nullable', 'boolean'],
            'allow_backorders'        => ['nullable', 'boolean'],
            'weight'                  => ['nullable', 'numeric', 'min:0'],
            'status'                  => ['nullable', Rule::enum(ProductStatus::class)],
            'is_featured'             => ['nullable', 'boolean'],
            'sort_order'              => ['nullable', 'integer', 'min:0'],
            'meta_title'              => ['nullable', 'array'],
            'meta_title.hy'           => ['nullable', 'string', 'max:255'],
            'meta_title.en'           => ['nullable', 'string', 'max:255'],
            'meta_description'        => ['nullable', 'array'],
            'meta_description.hy'     => ['nullable', 'string'],
            'meta_description.en'     => ['nullable', 'string'],
        ];
    }
}
