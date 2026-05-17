<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContactMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string  $senderName,
        public readonly ?string $senderEmail,
        public readonly ?string $senderPhone,
        public readonly string  $message,
    ) {
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = "Contact Form — {$this->senderName}";

        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting("New contact message from {$this->senderName}")
            ->line("**Name:** {$this->senderName}");

        if ($this->senderEmail) {
            $mail->line("**Email:** {$this->senderEmail}");
        }

        if ($this->senderPhone) {
            $mail->line("**Phone:** {$this->senderPhone}");
        }

        $mail->line('---')
             ->line($this->message)
             ->salutation(' ');

        return $mail;
    }
}
