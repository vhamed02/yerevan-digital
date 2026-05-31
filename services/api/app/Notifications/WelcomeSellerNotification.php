<?php

namespace App\Notifications;

use App\Notifications\Concerns\ResolvesLocale;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeSellerNotification extends Notification implements ShouldQueue
{
    use Queueable, ResolvesLocale;

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
        $locale = $this->resolveLocale($notifiable->locale ?? null);

        return (new MailMessage)
            ->subject(__('emails.welcome.subject', [], $locale))
            ->view('emails.auth.welcome-seller', [
                'user'   => $notifiable,
                'locale' => $locale,
            ]);
    }
}
