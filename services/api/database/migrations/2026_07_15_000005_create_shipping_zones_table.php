<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_zones', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();

            // Translatable {hy,en,ru}, e.g. "Yerevan" / "Regions".
            $table->json('name');

            // City names this zone covers. Matched case-insensitively.
            $table->json('cities');

            $table->decimal('rate', 15, 2)->default(0);
            // Order subtotal at or above which this zone ships free. null = never.
            $table->decimal('free_over', 15, 2)->nullable();

            // Fallback for any city no zone lists. At most one per store.
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['store_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_zones');
    }
};
