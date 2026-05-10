<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['hy' => 'Էլեկտրոնիկա',  'en' => 'Electronics'],
            ['hy' => 'Հագուստ',        'en' => 'Clothing'],
            ['hy' => 'Սնունդ',         'en' => 'Food'],
            ['hy' => 'Գեղեցկություն',  'en' => 'Beauty'],
            ['hy' => 'Տուն',           'en' => 'Home'],
            ['hy' => 'Սպորտ',          'en' => 'Sports'],
            ['hy' => 'Գրքեր',          'en' => 'Books'],
            ['hy' => 'Խաղալիքներ',     'en' => 'Toys'],
            ['hy' => 'Զարդեր',         'en' => 'Jewelry'],
            ['hy' => 'Այլ',            'en' => 'Other'],
        ];

        foreach ($categories as $translations) {
            Category::firstOrCreate(
                ['slug' => Str::slug($translations['en'])],
                [
                    'name'      => $translations,
                    'slug'      => Str::slug($translations['en']),
                    'is_active' => true,
                ]
            );
        }
    }
}
