<?php

namespace App\Models;

use App\Enums\TransactionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Transaction extends Model
{
    protected $fillable = [
        'uuid',
        'order_id',
        'store_id',
        'payment_gateway_id',
        'external_transaction_id',
        'amount',
        'currency',
        'status',
        'gateway_request',
        'gateway_response',
        'initiated_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount'           => 'decimal:2',
            'status'           => TransactionStatus::class,
            'gateway_request'  => 'array',
            'gateway_response' => 'array',
            'initiated_at'     => 'datetime',
            'completed_at'     => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $transaction) {
            if (empty($transaction->uuid)) {
                $transaction->uuid = (string) Str::uuid();
            }
        });
    }

    public function scopeByStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function paymentGateway(): BelongsTo
    {
        return $this->belongsTo(PaymentGateway::class);
    }
}
