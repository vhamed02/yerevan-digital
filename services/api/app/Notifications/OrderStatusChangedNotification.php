<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

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
        $locale  = $notifiable->locale ?? 'hy';
        $subject = $locale === 'hy'
            ? "Ձեր պատվերի կարգավիճակը փոխվել է #{$this->order->order_number}"
            : "Your order status updated #{$this->order->order_number}";

        return (new MailMessage)
            ->subject($subject)
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
