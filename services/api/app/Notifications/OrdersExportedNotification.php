<?php

namespace App\Notifications;

use App\Notifications\Concerns\ResolvesLocale;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrdersExportedNotification extends Notification implements ShouldQueue
{
    use Queueable, ResolvesLocale;

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
        $locale   = $this->resolveLocale($notifiable->locale ?? null);
        $filename = 'orders-' . now()->format('Y-m-d') . '.csv';

        return (new MailMessage)
            ->subject(__('emails.orders_export.subject', ['store' => $this->storeName], $locale))
            ->line(__('emails.orders_export.line', [], $locale))
            ->attachData($this->csv, $filename, ['mime' => 'text/csv']);
    }
}
