<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('store_templates')->whereNotIn('key', ['minimal', 'spark'])->delete();

        DB::table('store_templates')->updateOrInsert(
            ['key' => 'spark'],
            [
                'name'        => json_encode(['hy' => 'Սպարք', 'en' => 'Spark']),
                'description' => json_encode(['hy' => 'Ժամանակակից խանութ՝ ֆիչերד սլայդերով', 'en' => 'Modern storefront with featured slider']),
                'is_active'   => true,
                'sort_order'  => 2,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]
        );

        DB::table('stores')
            ->whereNotIn('active_template_key', ['minimal', 'spark'])
            ->update(['active_template_key' => 'minimal']);
    }

    public function down(): void {}
};
