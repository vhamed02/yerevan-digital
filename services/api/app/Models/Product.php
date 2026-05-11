<?php

namespace App\Models;

use App\Enums\ProductStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Spatie\Translatable\HasTranslations;

class Product extends Model
{
    use HasFactory, HasTranslations, SoftDeletes;

    public array $translatable = ['name', 'description', 'short_description', 'meta_title', 'meta_description'];

    protected $attributes = [
        'status'           => 'draft',
        'stock'            => 0,
        'manage_stock'     => true,
        'allow_backorders' => false,
        'is_featured'      => false,
        'sort_order'       => 0,
    ];

    protected $fillable = [
        'uuid',
        'store_id',
        'category_id',
        'name',
        'slug',
        'description',
        'short_description',
        'sku',
        'price',
        'compare_price',
        'cost_price',
        'stock',
        'manage_stock',
        'allow_backorders',
        'weight',
        'status',
        'is_featured',
        'sort_order',
        'meta_title',
        'meta_description',
    ];

    protected function casts(): array
    {
        return [
            'price'           => 'decimal:2',
            'compare_price'   => 'decimal:2',
            'cost_price'      => 'decimal:2',
            'weight'          => 'decimal:2',
            'stock'           => 'integer',
            'sort_order'      => 'integer',
            'manage_stock'    => 'boolean',
            'allow_backorders' => 'boolean',
            'is_featured'     => 'boolean',
            'status'          => ProductStatus::class,
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $product) {
            if (empty($product->uuid)) {
                $product->uuid = (string) Str::uuid();
            }
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', ProductStatus::Active);
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function scopeByStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
