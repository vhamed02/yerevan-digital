<?php

namespace App\Http\Requests\Admin;

use App\Enums\PostStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug'                => ['nullable', 'string', 'max:150', 'unique:posts,slug', 'regex:/^[a-z0-9-]+$/'],
            'title'               => ['required', 'array'],
            'title.en'            => ['required', 'string', 'max:200'],
            'title.hy'            => ['nullable', 'string', 'max:200'],
            'title.ru'            => ['nullable', 'string', 'max:200'],
            'excerpt'             => ['nullable', 'array'],
            'excerpt.en'          => ['nullable', 'string', 'max:500'],
            'excerpt.hy'          => ['nullable', 'string', 'max:500'],
            'excerpt.ru'          => ['nullable', 'string', 'max:500'],
            'content'             => ['required', 'array'],
            'content.en'          => ['required', 'string'],
            'content.hy'          => ['nullable', 'string'],
            'content.ru'          => ['nullable', 'string'],
            'cover'               => ['nullable', 'array'],
            'cover.original'      => ['required_with:cover', 'string', 'max:500'],
            'cover.thumbnail'     => ['required_with:cover', 'string', 'max:500'],
            'cover.medium'        => ['required_with:cover', 'string', 'max:500'],
            'cover.large'         => ['required_with:cover', 'string', 'max:500'],
            'author_name'         => ['nullable', 'string', 'max:100'],
            'status'              => ['nullable', Rule::enum(PostStatus::class)],
            'published_at'        => ['nullable', 'date'],
            'meta_title'          => ['nullable', 'array'],
            'meta_title.en'       => ['nullable', 'string', 'max:200'],
            'meta_title.hy'       => ['nullable', 'string', 'max:200'],
            'meta_title.ru'       => ['nullable', 'string', 'max:200'],
            'meta_description'    => ['nullable', 'array'],
            'meta_description.en' => ['nullable', 'string', 'max:500'],
            'meta_description.hy' => ['nullable', 'string', 'max:500'],
            'meta_description.ru' => ['nullable', 'string', 'max:500'],
        ];
    }
}
