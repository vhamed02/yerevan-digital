<?php

namespace App\Repositories\Contracts;

use App\Models\StoreTemplate;
use Illuminate\Database\Eloquent\Collection;

interface StoreTemplateRepositoryInterface
{
    public function allOrdered(): Collection;

    public function allActive(): Collection;

    public function create(array $data): StoreTemplate;

    public function update(StoreTemplate $template, array $data): StoreTemplate;

    public function toggle(StoreTemplate $template): StoreTemplate;
}
