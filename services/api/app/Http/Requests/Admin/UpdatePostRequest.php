<?php

namespace App\Http\Requests\Admin;

use App\Enums\PostStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug'                => ['sometimes', 'string', 'max:150', Rule::unique('posts', 'slug')->ignore($this->route('slug'), 'slug'), 'regex:/^[a-z0-9-]+$/'],
            'title'               => ['sometimes', 'array'],
            'title.en'            => ['required_with:title', 'string', 'max:200'],
            'title.hy'            => ['nullable', 'string', 'max:200'],
            'title.ru'            => ['nullable', 'string', 'max:200'],
            'excerpt'             => ['sometimes', 'nullable', 'array'],
            'excerpt.en'          => ['nullable', 'string', 'max:500'],
            'excerpt.hy'          => ['nullable', 'string', 'max:500'],
            'excerpt.ru'          => ['nullable', 'string', 'max:500'],
            'content'             => ['sometimes', 'array'],
            'content.en'          => ['required_with:content', 'string'],
            'content.hy'          => ['nullable', 'string'],
            'content.ru'          => ['nullable', 'string'],
            'cover'               => ['sometimes', 'nullable', 'array'],
            'cover.original'      => ['required_with:cover', 'string', 'max:500'],
            'cover.thumbnail'     => ['required_with:cover', 'string', 'max:500'],
            'cover.medium'        => ['required_with:cover', 'string', 'max:500'],
            'cover.large'         => ['required_with:cover', 'string', 'max:500'],
            'author_name'         => ['sometimes', 'nullable', 'string', 'max:100'],
            'status'              => ['sometimes', Rule::enum(PostStatus::class)],
            'published_at'        => ['sometimes', 'nullable', 'date'],
            'meta_title'          => ['sometimes', 'nullable', 'array'],
            'meta_title.en'       => ['nullable', 'string', 'max:200'],
            'meta_title.hy'       => ['nullable', 'string', 'max:200'],
            'meta_title.ru'       => ['nullable', 'string', 'max:200'],
            'meta_description'    => ['sometimes', 'nullable', 'array'],
            'meta_description.en' => ['nullable', 'string', 'max:500'],
            'meta_description.hy' => ['nullable', 'string', 'max:500'],
            'meta_description.ru' => ['nullable', 'string', 'max:500'],
        ];
    }
}
