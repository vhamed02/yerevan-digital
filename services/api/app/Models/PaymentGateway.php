<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;
use Spatie\Translatable\HasTranslations;

class PaymentGateway extends Model implements AuditableContract
{
    use Auditable, HasFactory, HasTranslations;

    public array $translatable = ['display_name', 'description', 'instructions'];

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'logo',
        'is_active',
        'is_sandbox_available',
        'required_fields',
        'instructions',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active'            => 'boolean',
            'is_sandbox_available' => 'boolean',
            'required_fields'      => 'array',
            'sort_order'           => 'integer',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function storeGateways(): HasMany
    {
        return $this->hasMany(StorePaymentGateway::class);
    }
}
