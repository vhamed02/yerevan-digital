<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = [
            ['slug' => 'about',   'title' => ['hy' => 'Մեր մասին',       'en' => 'About Us']],
            ['slug' => 'contact', 'title' => ['hy' => 'Կապ',              'en' => 'Contact']],
            ['slug' => 'terms',   'title' => ['hy' => 'Օգտագործման պայմաններ', 'en' => 'Terms of Use']],
            ['slug' => 'privacy', 'title' => ['hy' => 'Գաղտնիության քաղաքականություն', 'en' => 'Privacy Policy']],
        ];

        foreach ($defaults as $page) {
            DB::table('pages')->insertOrIgnore([
                'slug'         => $page['slug'],
                'title'        => json_encode($page['title']),
                'content'      => json_encode(['hy' => '', 'en' => '']),
                'is_published' => true,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('pages')->whereIn('slug', ['about', 'contact', 'terms', 'privacy'])->delete();
    }
};
