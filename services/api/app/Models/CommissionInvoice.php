<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class CommissionInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'store_id',
        'status',
        'period_start',
        'period_end',
        'amount',
        'currency',
        'external_invoice_id',
        'payment_reference',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'status'       => InvoiceStatus::class,
            'amount'       => 'decimal:2',
            'period_start' => 'date',
            'period_end'   => 'date',
            'paid_at'      => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $invoice) {
            if (empty($invoice->uuid)) {
                $invoice->uuid = (string) Str::uuid();
            }
        });
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function scopeByStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeUnpaid(Builder $query): Builder
    {
        return $query->where('status', InvoiceStatus::Pending);
    }
}
