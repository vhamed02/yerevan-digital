<?php

namespace App\Models;

use App\Enums\StoreStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;
use Spatie\Translatable\HasTranslations;

class Store extends Model implements AuditableContract
{
    use Auditable, HasFactory, HasTranslations, SoftDeletes;

    public array $translatable = ['name', 'description', 'meta_title', 'meta_description'];

    protected $fillable = [
        'uuid',
        'user_id',
        'name',
        'slug',
        'description',
        'logo',
        'banner',
        'favicon',
        'primary_color',
        'active_template_key',
        'status',
        'currency',
        'address',
        'phone',
        'email',
        'social_links',
        'custom_domain',
        'custom_domain_token',
        'custom_domain_verified_at',
        'meta_title',
        'meta_description',
        'is_featured',
        'commission_rate',
    ];

    protected function casts(): array
    {
        return [
            'social_links'              => 'array',
            'status'                    => StoreStatus::class,
            'is_featured'               => 'boolean',
            'commission_rate'           => 'decimal:4',
            'custom_domain_verified_at' => 'datetime',
        ];
    }

    /** A domain only routes once ownership has been proven. */
    public function hasVerifiedDomain(): bool
    {
        return $this->custom_domain !== null && $this->custom_domain_verified_at !== null;
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $store) {
            if (empty($store->uuid)) {
                $store->uuid = (string) Str::uuid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', StoreStatus::Active);
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(StoreTemplate::class, 'active_template_key', 'key');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(StoreSetting::class);
    }

    public function paymentGateways(): HasMany
    {
        return $this->hasMany(StorePaymentGateway::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
