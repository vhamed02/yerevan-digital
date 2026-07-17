<?php

namespace App\Console\Commands;

use App\Models\CommissionInvoice;
use App\Notifications\CommissionInvoiceNotification;
use App\Services\CommissionInvoiceService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SendCommissionInvoices extends Command
{
    protected $signature = 'invoices:commission
        {--dry-run : Compute and print invoices without persisting or emailing}
        {--store= : Limit generation and mail to a single store slug}
        {--no-mail : Persist invoices but skip sending notifications}
        {--period-start= : Override the billing period start date (YYYY-MM-DD)}';

    protected $description = "Snapshot each store's prior-week commission balance into a payable invoice";

    public function __construct(private readonly CommissionInvoiceService $invoices)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        [$start, $end] = $this->resolvePeriod();
        $storeSlug = $this->option('store');

        if ($this->option('dry-run')) {
            // Reuse the real generation path but roll it back, so the preview
            // reflects exactly what a live run would create.
            DB::beginTransaction();
            $invoices = $this->invoices->generateForPeriod($start, $end, $storeSlug);
            $this->renderTable($invoices);
            DB::rollBack();

            return self::SUCCESS;
        }

        $invoices = $this->invoices->generateForPeriod($start, $end, $storeSlug);

        if (!$this->option('no-mail')) {
            foreach ($invoices as $invoice) {
                $invoice->store->owner->notify(new CommissionInvoiceNotification($invoice));
            }
        }

        $this->renderTable($invoices);

        return self::SUCCESS;
    }

    private function resolvePeriod(): array
    {
        if ($periodStart = $this->option('period-start')) {
            $start = Carbon::parse($periodStart)->startOfDay();

            return [$start, $start->copy()->addWeek()];
        }

        $thisMonday = now()->startOfWeek();

        return [$thisMonday->copy()->subWeek(), $thisMonday];
    }

    /** @param Collection<int, CommissionInvoice> $invoices */
    private function renderTable(Collection $invoices): void
    {
        if ($invoices->isEmpty()) {
            $this->info('No invoices to generate for this period.');

            return;
        }

        $this->table(
            ['Store', 'Period', 'Amount'],
            $invoices->map(fn (CommissionInvoice $invoice) => [
                $invoice->store->slug,
                "{$invoice->period_start->toDateString()} - {$invoice->period_end->toDateString()}",
                "{$invoice->amount} {$invoice->currency}",
            ])->all()
        );
    }
}
