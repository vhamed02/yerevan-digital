<?php

namespace Database\Seeders;

use App\Models\StoreTemplate;
use Illuminate\Database\Seeder;

class StoreTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'key'         => 'minimal',
                'name'        => ['hy' => 'Մինիմալ', 'en' => 'Minimal'],
                'description' => ['hy' => 'Մաքուր և մինիմալ ձևավորում', 'en' => 'Clean and minimal design'],
                'is_active'   => true,
                'sort_order'  => 1,
            ],
            [
                'key'         => 'bold',
                'name'        => ['hy' => 'Համարձակ', 'en' => 'Bold'],
                'description' => ['hy' => 'Վառ գույներով և համարձակ ոճով', 'en' => 'Vibrant colors and bold style'],
                'is_active'   => true,
                'sort_order'  => 2,
            ],
            [
                'key'         => 'elegant',
                'name'        => ['hy' => 'Էլեգանտ', 'en' => 'Elegant'],
                'description' => ['hy' => 'Նուրբ և էլեգանտ տեսք', 'en' => 'Refined and elegant look'],
                'is_active'   => true,
                'sort_order'  => 3,
            ],
        ];

        foreach ($templates as $template) {
            StoreTemplate::updateOrCreate(['key' => $template['key']], $template);
        }
    }
}
