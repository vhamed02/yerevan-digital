<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreCouponRequest;
use App\Http\Resources\Seller\CouponResource;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (! $store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $query = Coupon::byStore($store->id)->latest('id');

        if ($search = $request->query('search')) {
            $query->where('code', 'like', '%' . $search . '%');
        }

        $isActive = $request->query('is_active');
        if ($isActive !== null && $isActive !== '') {
            $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        }

        return $this->paginated(CouponResource::collection($query->paginate(20)));
    }

    public function store(StoreCouponRequest $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (! $store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $coupon = Coupon::create([
            ...$request->validated(),
            'store_id' => $store->id,
        ]);

        return $this->success(new CouponResource($coupon), 'Coupon created.', 201);
    }

    public function show(Request $request, string $uuid): JsonResponse
    {
        return $this->success(new CouponResource($this->findOrFail($request, $uuid)));
    }

    public function update(StoreCouponRequest $request, string $uuid): JsonResponse
    {
        $coupon = $this->findOrFail($request, $uuid);
        $coupon->update($request->validated());

        return $this->success(new CouponResource($coupon->fresh()), 'Coupon updated.');
    }

    public function destroy(Request $request, string $uuid): JsonResponse
    {
        // Soft delete: orders keep coupon_id, and coupon_code is snapshotted on
        // the order anyway, so redemption history survives.
        $this->findOrFail($request, $uuid)->delete();

        return $this->success(null, 'Coupon deleted.');
    }

    /** Always scoped by store, so one seller can never reach another's coupon. */
    private function findOrFail(Request $request, string $uuid): Coupon
    {
        $store = $request->attributes->get('sellerStore');

        abort_if(! $store, 404, 'You have not created a store yet.');

        return Coupon::byStore($store->id)->where('uuid', $uuid)->firstOrFail();
    }
}
