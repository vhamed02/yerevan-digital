<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Seller order list (WHERE store_id ORDER BY created_at) and the
            // per-store dashboard date-range queries — removes the filesort.
            $table->index(['store_id', 'created_at']);

            // Admin cross-store dashboard date stats (today / month / 30-day chart).
            $table->index('created_at');
        });

        Schema::table('products', function (Blueprint $table) {
            // Storefront category navigation (count of active products per category)
            // and the seller product list category filter.
            $table->index(['category_id', 'store_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['store_id', 'created_at']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['category_id', 'store_id', 'status']);
        });
    }
};
