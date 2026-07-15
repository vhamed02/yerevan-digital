<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('code', 50);
            $table->enum('type', ['fixed', 'percent']);

            // fixed: an AMD amount. percent: 0-100.
            $table->decimal('value', 15, 2);

            $table->decimal('min_order_amount', 15, 2)->default(0);
            // Caps a percent coupon's payout; ignored for fixed coupons.
            $table->decimal('max_discount_amount', 15, 2)->nullable();

            // null = unlimited redemptions.
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Codes are unique per store, not globally — two stores may both use SALE10.
            $table->unique(['store_id', 'code']);
            $table->index(['store_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
