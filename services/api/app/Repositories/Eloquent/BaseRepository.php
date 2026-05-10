<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\RepositoryContract;
use Illuminate\Database\Eloquent\Model;

abstract class BaseRepository implements RepositoryContract
{
    public function __construct(protected readonly Model $model) {}

    public function all(): iterable
    {
        return $this->model->all();
    }

    public function find(int|string $id): mixed
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): mixed
    {
        return $this->model->create($data);
    }

    public function update(int|string $id, array $data): mixed
    {
        $record = $this->find($id);
        $record->update($data);
        return $record->fresh();
    }

    public function delete(int|string $id): bool
    {
        return (bool) $this->model->destroy($id);
    }
}
