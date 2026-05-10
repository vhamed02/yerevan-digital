<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Seller     = 'seller';
    case Customer   = 'customer';
}
