<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Models\Commission;
use App\Models\CommissionInvoice;
use App\Support\Money;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Turns the append-only commission ledger into billable, period-based invoices.
 * The ledger itself is never touched — a store's outstanding balance is always
 * derived by summing its ledger window, never stored as a running total.
 */
class CommissionInvoiceService
{
    /**
     * Snapshot each store's net commission over [start, end) into a
     * commission_invoices row. Idempotent per store+period via the
     * unique(store_id, period_start) constraint — re-running a period creates
     * nothing new, so callers can safely retry without double-billing.
     *
     * @return Collection<int, CommissionInvoice> invoices created by this call only
     */
    public function generateForPeriod(CarbonInterface $start, CarbonInterface $end, ?string $storeSlug = null): Collection
    {
        $storeIds = Commission::query()
            ->where('created_at', '>=', $start)
            ->where('created_at', '<', $end)
            ->when($storeSlug !== null, fn (Builder $q) => $q->whereHas(
                'store',
                fn (Builder $store) => $store->where('slug', $storeSlug)
            ))
            ->distinct()
            ->pluck('store_id');

        $created = collect();

        foreach ($storeIds as $storeId) {
            $net = Commission::where('store_id', $storeId)
                ->where('created_at', '>=', $start)
                ->where('created_at', '<', $end)
                ->pluck('amount')
                ->reduce(fn (string $carry, $amount) => Money::add($carry, (string) $amount), Money::ZERO);

            if (Money::compare($net, '0') !== 1) {
                continue;
            }

            // Pass Carbon instances, not ->toDateString(): the model's date cast
            // formats a stored value to "Y-m-d H:i:s" on insert, and a plain "Y-m-d"
            // string in the search array would then never match on a re-run,
            // defeating the unique(store_id, period_start) idempotency guard.
            $invoice = CommissionInvoice::firstOrCreate(
                ['store_id' => $storeId, 'period_start' => $start],
                [
                    'period_end' => $end,
                    'amount'     => $net,
                    'currency'   => 'AMD',
                    'status'     => InvoiceStatus::Pending,
                ]
            );

            if ($invoice->wasRecentlyCreated) {
                $created->push($invoice);
            }
        }

        return $created;
    }

    public function outstandingFor(int $storeId): string
    {
        return CommissionInvoice::byStore($storeId)
            ->unpaid()
            ->pluck('amount')
            ->reduce(fn (string $carry, $amount) => Money::add($carry, (string) $amount), Money::ZERO);
    }
}
