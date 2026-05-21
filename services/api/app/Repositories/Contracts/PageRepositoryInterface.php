<?php

namespace App\Repositories\Contracts;

use App\Models\Page;
use Illuminate\Database\Eloquent\Collection;

interface PageRepositoryInterface
{
    public function allOrdered(): Collection;

    public function findBySlug(string $slug): Page;

    public function create(array $data): Page;

    public function update(Page $page, array $data): Page;

    public function deleteBySlug(string $slug): void;
}
