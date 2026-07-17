<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\InvoiceResource;
use App\Models\CommissionInvoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionInvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CommissionInvoice::with('store')->latest('id');

        if ($storeId = $request->query('store_id')) {
            $query->where('store_id', (int) $storeId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($from = $request->query('from')) {
            $query->whereDate('period_start', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('period_start', '<=', $to);
        }

        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);

        return $this->paginated(InvoiceResource::collection($query->paginate($perPage)));
    }

    public function summary(Request $request): JsonResponse
    {
        $scope = fn () => CommissionInvoice::query()
            ->when($request->query('store_id'), fn ($q, $id) => $q->where('store_id', (int) $id));

        return $this->success([
            'outstanding' => $this->money($scope()->where('status', InvoiceStatus::Pending)->sum('amount')),
            'paid'        => $this->money($scope()->where('status', InvoiceStatus::Paid)->sum('amount')),
            'currency'    => 'AMD',
        ]);
    }

    public function void(string $uuid): JsonResponse
    {
        $invoice = CommissionInvoice::where('uuid', $uuid)->firstOrFail();

        if ($invoice->status !== InvoiceStatus::Pending) {
            return $this->error('Only a pending invoice can be voided.', 422);
        }

        $invoice->update(['status' => InvoiceStatus::Void]);

        return $this->success(new InvoiceResource($invoice->fresh()), 'Invoice voided.');
    }

    /** Normalise a SQL SUM to a fixed-scale string (SQLite returns a float, MySQL a string). */
    private function money(mixed $sum): string
    {
        return number_format((float) ($sum ?? 0), 2, '.', '');
    }
}
