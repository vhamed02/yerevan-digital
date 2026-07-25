<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Storefront template settings used to live in MongoDB, which cost a whole
     * container for one document per store. It is a single JSON blob keyed by
     * store, so MySQL holds it just as well — and deleting a store now takes
     * its config with it instead of leaving an orphan document behind.
     */
    public function up(): void
    {
        Schema::create('store_template_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('config');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_template_configs');
    }
};
