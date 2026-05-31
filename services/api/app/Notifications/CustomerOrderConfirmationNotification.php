<?php

namespace App\Notifications;

use App\Models\Order;
use App\Notifications\Concerns\ResolvesLocale;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomerOrderConfirmationNotification extends Notification implements ShouldQueue
{
    use Queueable, ResolvesLocale;

    public function __construct(public readonly Order $order)
    {
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $order  = $this->order->loadMissing(['items', 'store']);
        $locale = $this->resolveLocale($order->locale);

        return (new MailMessage)
            ->subject(__('emails.order_confirmation.subject', ['number' => $order->order_number], $locale))
            ->view('emails.orders.order-confirmation', [
                'order'  => $order,
                'locale' => $locale,
            ]);
    }
}
