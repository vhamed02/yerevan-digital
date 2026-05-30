<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                  => ['sometimes', 'array'],
            'title.hy'               => ['required_with:title', 'string', 'max:200'],
            'title.en'               => ['required_with:title', 'string', 'max:200'],
            'title.ru'               => ['nullable', 'string', 'max:200'],
            'content'                => ['sometimes', 'array'],
            'content.hy'             => ['required_with:content', 'string'],
            'content.en'             => ['required_with:content', 'string'],
            'content.ru'             => ['nullable', 'string'],
            'meta_title'             => ['sometimes', 'nullable', 'array'],
            'meta_title.hy'          => ['nullable', 'string', 'max:200'],
            'meta_title.en'          => ['nullable', 'string', 'max:200'],
            'meta_title.ru'          => ['nullable', 'string', 'max:200'],
            'meta_description'       => ['sometimes', 'nullable', 'array'],
            'meta_description.hy'    => ['nullable', 'string', 'max:500'],
            'meta_description.en'    => ['nullable', 'string', 'max:500'],
            'meta_description.ru'    => ['nullable', 'string', 'max:500'],
            'is_published'           => ['sometimes', 'boolean'],
        ];
    }
}
