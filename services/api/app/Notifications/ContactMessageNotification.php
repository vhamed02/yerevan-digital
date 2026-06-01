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
        $mail = (new MailMessage)
            ->subject("New contact message from {$this->senderName}")
            ->view('emails.contact', [
                'senderName'  => $this->senderName,
                'senderEmail' => $this->senderEmail,
                'senderPhone' => $this->senderPhone,
                'message'     => $this->message,
            ]);

        if ($this->senderEmail) {
            $mail->replyTo($this->senderEmail, $this->senderName);
        }

        return $mail;
    }
}
