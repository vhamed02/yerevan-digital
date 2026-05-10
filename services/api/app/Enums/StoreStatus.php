<?php

namespace App\Enums;

enum StoreStatus: string
{
    case Pending   = 'pending';
    case Active    = 'active';
    case Suspended = 'suspended';
}
