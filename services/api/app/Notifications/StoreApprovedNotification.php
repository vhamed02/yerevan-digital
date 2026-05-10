<?php

namespace App\Notifications;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StoreApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Store $store)
    {
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale  = $notifiable->locale ?? 'hy';
        $subject = $locale === 'hy' ? 'Ձեր խանութը հաստատված է!' : 'Your store is now live on Vendora!';

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.store.approved', [
                'store'  => $this->store,
                'user'   => $notifiable,
                'locale' => $locale,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'store_approved',
            'store_id'   => $this->store->id,
            'store_slug' => $this->store->slug,
        ];
    }
}
