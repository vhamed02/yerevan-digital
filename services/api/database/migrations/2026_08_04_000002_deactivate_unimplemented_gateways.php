<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Hold the two placeholder bank gateways off until real documentation exists.
 *
 * `ineco` and `converse` have been stubs since the first payment commit — every
 * method reports "coming soon" or throws. They were already `is_active = 0` on
 * this server, but nothing stopped an admin toggling them on, at which point a
 * buyer selecting one would hit a dead gateway.
 *
 * Belt and braces with the marker interface: `UnimplementedGateway` now blocks
 * activation in `Admin\PaymentGatewayController::toggle`, and this pins the
 * stored state to match. Re-enabling is a deliberate act — implement the real
 * protocol from the provider's own docs, drop the marker, then activate.
 */
return new class extends Migration
{
    private const PLACEHOLDERS = ['ineco', 'converse'];

    public function up(): void
    {
        DB::table('payment_gateways')
            ->whereIn('name', self::PLACEHOLDERS)
            ->update(['is_active' => false, 'updated_at' => now()]);

        // A seller can't have configured one (they were never activatable), but
        // disable any row defensively so a stale config can't surface a dead
        // payment method on a storefront.
        $ids = DB::table('payment_gateways')->whereIn('name', self::PLACEHOLDERS)->pluck('id');

        if ($ids->isNotEmpty()) {
            DB::table('store_payment_gateways')
                ->whereIn('payment_gateway_id', $ids)
                ->update(['is_enabled' => false, 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        // Intentionally irreversible: re-activating a gateway with no working
        // integration is never the right rollback.
    }
};
