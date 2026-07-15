<?php

namespace App\Enums;

enum CommissionType: string
{
    case Accrual  = 'accrual';
    case Reversal = 'reversal';
}
