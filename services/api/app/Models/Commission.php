<?php

namespace App\Models;

use App\Enums\CommissionType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Append-only ledger: rows are never updated or deleted. A commission is undone
 * by writing a matching reversal row, so history stays auditable and a store's
 * outstanding balance is always SUM(amount).
 */
class Commission extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'store_id',
        'order_id',
        'type',
        'rate',
        'base_amount',
        'amount',
        'currency',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'type'        => CommissionType::class,
            'rate'        => 'decimal:4',
            'base_amount' => 'decimal:2',
            'amount'      => 'decimal:2',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $commission) {
            if (empty($commission->uuid)) {
                $commission->uuid = (string) Str::uuid();
            }
        });
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function scopeByStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }
}
