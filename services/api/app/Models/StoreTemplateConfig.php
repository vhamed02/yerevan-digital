<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class StoreTemplateConfig extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'store_template_configs';

    protected $fillable = ['store_id', 'config'];

    protected function casts(): array
    {
        return [
            'store_id' => 'integer',
            'config'   => 'array',
        ];
    }
}
