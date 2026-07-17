<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case Pending = 'pending';
    case Paid    = 'paid';
    case Void    = 'void';

    public function allowedTransitions(): array
    {
        return match($this) {
            self::Pending => [self::Paid, self::Void],
            self::Paid,
            self::Void    => [],
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions(), true);
    }
}
