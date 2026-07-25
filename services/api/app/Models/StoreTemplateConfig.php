<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreTemplateConfig extends Model
{
    protected $fillable = ['store_id', 'config'];

    protected function casts(): array
    {
        return [
            'store_id' => 'integer',
            'config'   => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
