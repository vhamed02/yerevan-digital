<?php

namespace App\Notifications;

use App\Models\Store;
use App\Notifications\Concerns\ResolvesLocale;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StoreSuspendedNotification extends Notification implements ShouldQueue
{
    use Queueable, ResolvesLocale;

    public function __construct(
        public readonly Store $store,
        public readonly ?string $reason = null
    ) {
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $this->resolveLocale($notifiable->locale ?? null);

        return (new MailMessage)
            ->subject(__('emails.store_suspended.subject', [], $locale))
            ->view('emails.store.suspended', [
                'store'  => $this->store,
                'user'   => $notifiable,
                'reason' => $this->reason,
                'locale' => $locale,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'store_suspended',
            'store_id'   => $this->store->id,
            'store_slug' => $this->store->slug,
            'reason'     => $this->reason,
        ];
    }
}
