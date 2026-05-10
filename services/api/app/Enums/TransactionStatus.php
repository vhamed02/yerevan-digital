<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case Pending  = 'pending';
    case Success  = 'success';
    case Failed   = 'failed';
    case Refunded = 'refunded';
}
