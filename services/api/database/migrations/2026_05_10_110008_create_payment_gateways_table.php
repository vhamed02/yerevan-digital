<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_gateways', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->json('display_name');
            $table->json('description')->nullable();
            $table->string('logo', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_sandbox_available')->default(true);
            $table->json('required_fields');
            $table->json('instructions')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_gateways');
    }
};
