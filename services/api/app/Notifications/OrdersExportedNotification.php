<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrdersExportedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $csv,
        private readonly string $storeName
    ) {
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale  = $notifiable->locale ?? 'hy';
        $subject = $locale === 'hy'
            ? "Պատվերների արտահանում — {$this->storeName}"
            : "Orders Export — {$this->storeName}";

        $line = $locale === 'hy'
            ? 'Կցված ֆայլում կգտնեք Ձեր պատվերների արտահանումը CSV ֆորմատով։'
            : 'Please find your orders export attached as a CSV file.';

        $filename = 'orders-' . now()->format('Y-m-d') . '.csv';

        return (new MailMessage)
            ->subject($subject)
            ->line($line)
            ->attachData($this->csv, $filename, ['mime' => 'text/csv']);
    }
}
