<?php

namespace App\Notifications;

use App\Models\CommissionInvoice;
use App\Notifications\Concerns\ResolvesLocale;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommissionInvoiceNotification extends Notification implements ShouldQueue
{
    use Queueable, ResolvesLocale;

    public function __construct(public readonly CommissionInvoice $invoice)
    {
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
            ->subject(__('emails.commission_invoice.subject', [], $locale))
            ->view('emails.invoices.commission', [
                'amount'       => $this->invoice->amount,
                'period_start' => $this->invoice->period_start,
                'period_end'   => $this->invoice->period_end,
                'payUrl'       => rtrim(config('app.frontend_url'), '/') . '/seller/invoices',
                'locale'       => $locale,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'uuid'         => $this->invoice->uuid,
            'amount'       => $this->invoice->amount,
            'period_start' => $this->invoice->period_start,
            'period_end'   => $this->invoice->period_end,
        ];
    }
}
