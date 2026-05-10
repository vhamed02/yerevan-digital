<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->json('name');
            $table->json('description')->nullable();
            $table->string('preview_image', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_templates');
    }
};
