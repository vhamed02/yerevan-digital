<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_payment_gateways', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_gateway_id')->constrained()->restrictOnDelete();
            $table->boolean('is_enabled')->default(false);
            $table->boolean('is_sandbox')->default(true);
            $table->text('credentials')->nullable();
            $table->timestamps();

            $table->unique(['store_id', 'payment_gateway_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_payment_gateways');
    }
};
