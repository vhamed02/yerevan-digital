<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CommissionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateCommissionRateRequest;
use App\Http\Resources\Admin\CommissionResource;
use App\Models\Commission;
use App\Models\Store;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    public function __construct(private readonly CommissionService $commissions) {}

    public function index(Request $request): JsonResponse
    {
        $query = Commission::with(['store', 'order'])->latest('id');

        if ($storeId = $request->query('store_id')) {
            $query->where('store_id', (int) $storeId);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($from = $request->query('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);

        return $this->paginated(CommissionResource::collection($query->paginate($perPage)));
    }

    public function summary(Request $request): JsonResponse
    {
        $scope = fn () => Commission::query()
            ->when($request->query('store_id'), fn ($q, $id) => $q->where('store_id', (int) $id));

        return $this->success([
            'accrued'      => $this->money($scope()->where('type', CommissionType::Accrual)->sum('amount')),
            'reversed'     => $this->money($scope()->where('type', CommissionType::Reversal)->sum('amount')),
            'net'          => $this->money($scope()->sum('amount')),
            'currency'     => 'AMD',
            'default_rate' => $this->commissions->platformDefaultRate(),
        ]);
    }

    public function updateStoreRate(UpdateCommissionRateRequest $request, Store $store): JsonResponse
    {
        $rate = $request->validated()['commission_rate'];

        $store->update(['commission_rate' => $rate]);

        return $this->success([
            'store_id'        => $store->id,
            'commission_rate' => $rate,
            'effective_rate'  => $this->commissions->rateFor($store->id),
        ], $rate === null ? 'Store now uses the platform default rate.' : 'Commission rate updated.');
    }

    /** Normalise a SQL SUM to a fixed-scale string (SQLite returns a float, MySQL a string). */
    private function money(mixed $sum): string
    {
        return number_format((float) ($sum ?? 0), 2, '.', '');
    }
}
