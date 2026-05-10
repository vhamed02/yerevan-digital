<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeSellerNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale  = $notifiable->locale ?? 'hy';
        $subject = $locale === 'hy' ? 'Բարի գալուստ Vendora!' : 'Welcome to Vendora!';

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.auth.welcome-seller', [
                'user'   => $notifiable,
                'locale' => $locale,
            ]);
    }
}
