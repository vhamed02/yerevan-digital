<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'store_id',
        'customer_id',
        'order_number',
        'status',
        'payment_status',
        'payment_method',
        'payment_gateway_response',
        'subtotal',
        'discount',
        'shipping_cost',
        'tax',
        'total',
        'currency',
        'customer_name',
        'customer_email',
        'customer_phone',
        'shipping_address',
        'notes',
        'paid_at',
        'shipped_at',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'payment_gateway_response' => 'array',
            'shipping_address'         => 'array',
            'subtotal'                 => 'decimal:2',
            'discount'                 => 'decimal:2',
            'shipping_cost'            => 'decimal:2',
            'tax'                      => 'decimal:2',
            'total'                    => 'decimal:2',
            'status'                   => OrderStatus::class,
            'payment_status'           => PaymentStatus::class,
            'paid_at'                  => 'datetime',
            'shipped_at'               => 'datetime',
            'delivered_at'             => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $order) {
            if (empty($order->uuid)) {
                $order->uuid = (string) Str::uuid();
            }
        });

        static::created(function (self $order) {
            $order->updateQuietly([
                'order_number' => sprintf('VEND-%d-%05d', (int) now()->year, $order->id),
            ]);
        });
    }

    public function scopeByStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
