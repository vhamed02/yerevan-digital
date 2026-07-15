<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            // stores.custom_domain already exists (nullable, unique) but was never
            // routable. These make it verifiable, and nothing serves a domain until
            // custom_domain_verified_at is set.
            $table->string('custom_domain_token', 64)->nullable()->after('custom_domain');
            $table->timestamp('custom_domain_verified_at')->nullable()->after('custom_domain_token');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['custom_domain_token', 'custom_domain_verified_at']);
        });
    }
};
