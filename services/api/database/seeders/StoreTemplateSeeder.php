<?php

namespace Database\Seeders;

use App\Models\StoreTemplate;
use Illuminate\Database\Seeder;

class StoreTemplateSeeder extends Seeder
{
    public function run(): void
    {
        StoreTemplate::whereNotIn('key', ['minimal', 'spark'])->delete();

        $templates = [
            [
                'key'         => 'minimal',
                'name'        => ['hy' => 'Մինիմալ', 'en' => 'Minimal'],
                'description' => ['hy' => 'Մաքուր և մինիմալ ձևավորում', 'en' => 'Clean and minimal design'],
                'is_active'   => true,
                'sort_order'  => 1,
            ],
            [
                'key'         => 'spark',
                'name'        => ['hy' => 'Սպարք', 'en' => 'Spark'],
                'description' => ['hy' => 'Ժամանակակից խանութ՝ ֆիչերד սլայդերով', 'en' => 'Modern storefront with featured slider'],
                'is_active'   => true,
                'sort_order'  => 2,
            ],
        ];

        foreach ($templates as $template) {
            StoreTemplate::updateOrCreate(['key' => $template['key']], $template);
        }
    }
}
