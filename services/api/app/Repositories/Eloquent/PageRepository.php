<?php

namespace App\Repositories\Eloquent;

use App\Models\Page;
use App\Repositories\Contracts\PageRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class PageRepository implements PageRepositoryInterface
{
    public function allOrdered(): Collection
    {
        return Page::orderBy('slug')->get(['id', 'slug', 'title', 'is_published', 'updated_at']);
    }

    public function findBySlug(string $slug): Page
    {
        return Page::where('slug', $slug)->firstOrFail();
    }

    public function create(array $data): Page
    {
        return Page::create($data);
    }

    public function update(Page $page, array $data): Page
    {
        $page->update($data);
        return $page;
    }

    public function deleteBySlug(string $slug): void
    {
        Page::where('slug', $slug)->firstOrFail()->delete();
    }
}
