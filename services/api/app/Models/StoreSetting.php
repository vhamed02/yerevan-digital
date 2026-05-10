<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class StoreSetting extends Model implements AuditableContract
{
    use Auditable;

    protected $fillable = ['store_id', 'key', 'value'];

    public function scopePlatform(Builder $query): Builder
    {
        return $query->whereNull('store_id');
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
