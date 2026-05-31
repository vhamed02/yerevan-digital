<?php

namespace App\Notifications;

use App\Models\Order;
use App\Notifications\Concerns\ResolvesLocale;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable, ResolvesLocale;

    public function __construct(public readonly Order $order)
    {
        $this->onQueue('notifications');
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $this->resolveLocale($this->order->locale ?? $notifiable->locale ?? null);

        return (new MailMessage)
            ->subject(__('emails.status_changed.subject', ['number' => $this->order->order_number], $locale))
            ->view('emails.orders.status-changed', [
                'order'  => $this->order,
                'user'   => $notifiable,
                'locale' => $locale,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'         => 'order_status_changed',
            'order_id'     => $this->order->id,
            'order_number' => $this->order->order_number,
            'status'       => $this->order->status->value,
        ];
    }
}
