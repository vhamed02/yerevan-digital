<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StorePaymentGateway extends Model
{
    protected $fillable = [
        'store_id',
        'payment_gateway_id',
        'is_enabled',
        'is_sandbox',
        'credentials',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'is_sandbox' => 'boolean',
        ];
    }

    protected function credentials(): Attribute
    {
        return Attribute::make(
            get: fn(?string $value) => $value ? json_decode(decrypt($value), true) : null,
            set: fn(mixed $value) => $value ? encrypt(json_encode($value)) : null,
        );
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function gateway(): BelongsTo
    {
        return $this->belongsTo(PaymentGateway::class, 'payment_gateway_id');
    }
}
