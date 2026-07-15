<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Spatie\Translatable\HasTranslations;

class ShippingZone extends Model
{
    use HasFactory, HasTranslations;

    public array $translatable = ['name'];

    protected $fillable = [
        'uuid',
        'store_id',
        'name',
        'cities',
        'rate',
        'free_over',
        'is_default',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'cities'     => 'array',
            'rate'       => 'decimal:2',
            'free_over'  => 'decimal:2',
            'is_default' => 'boolean',
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $zone) {
            if (empty($zone->uuid)) {
                $zone->uuid = (string) Str::uuid();
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

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Does this zone list the given city? Case- and whitespace-insensitive. */
    public function covers(?string $city): bool
    {
        if ($city === null || $city === '') {
            return false;
        }

        $needle = mb_strtolower(trim($city));

        foreach ($this->cities ?? [] as $candidate) {
            if (mb_strtolower(trim((string) $candidate)) === $needle) {
                return true;
            }
        }

        return false;
    }
}
