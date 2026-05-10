<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->json('name');
            $table->string('slug', 100)->unique();
            $table->json('description')->nullable();
            $table->string('logo', 500)->nullable();
            $table->string('banner', 500)->nullable();
            $table->string('favicon', 500)->nullable();
            $table->string('primary_color', 20)->default('#6366F1');
            $table->string('active_template_key', 50)->default('minimal');
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
            $table->string('currency', 10)->default('AMD');
            $table->text('address')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email')->nullable();
            $table->json('social_links')->nullable();
            $table->string('custom_domain')->nullable()->unique();
            $table->json('meta_title')->nullable();
            $table->json('meta_description')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('is_featured');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
