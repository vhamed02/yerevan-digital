<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomerOrderConfirmationNotification extends Notification implements ShouldQueue
{
    use Queueable;

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
        $locale = $notifiable->locale ?? 'hy';
        $subject = $locale === 'hy'
            ? "Պատվերը հաստատված է — #{$order->order_number}"
            : "Order Confirmed — #{$order->order_number}";

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.orders.order-confirmation', [
                'order'  => $order,
                'locale' => $locale,
            ]);
    }
}
