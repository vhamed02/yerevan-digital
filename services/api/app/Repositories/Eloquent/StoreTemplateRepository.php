<?php

namespace App\Repositories\Eloquent;

use App\Models\StoreTemplate;
use App\Repositories\Contracts\StoreTemplateRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class StoreTemplateRepository implements StoreTemplateRepositoryInterface
{
    public function allOrdered(): Collection
    {
        return StoreTemplate::withCount('stores')->orderBy('sort_order')->get();
    }

    public function allActive(): Collection
    {
        return StoreTemplate::active()->orderBy('sort_order')->get();
    }

    public function create(array $data): StoreTemplate
    {
        return StoreTemplate::create($data);
    }

    public function update(StoreTemplate $template, array $data): StoreTemplate
    {
        $template->update($data);
        return $template->fresh();
    }

    public function toggle(StoreTemplate $template): StoreTemplate
    {
        $template->update(['is_active' => !$template->is_active]);
        return $template->fresh();
    }
}
