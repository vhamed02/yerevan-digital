<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Add the missing `telcell` payment_gateways row.
 *
 * Telcell shipped in full on 2026-07-17 — gateway class, registry entry, both
 * checkout templates, 26 tests — and `PaymentGatewaySeeder` has defined its row
 * ever since. But `scripts/deploy.sh` runs `migrate --force` and **never seeds**,
 * so the row never reached this server: production held only `idram`, `ineco`
 * and `converse`.
 *
 * The consequence was silent. `Store\PaymentController::initiate` resolves a
 * store's gateway by joining `payment_gateways` on name, and
 * `Seller\PaymentController::available()` lists only active rows — with no row,
 * no seller could enable Telcell and it never appeared in a storefront. Nothing
 * errored; the option simply did not exist. Commission-invoice payment was
 * unaffected because it reads `config/telcell.php` and the registry directly,
 * never this table.
 *
 * Values mirror `PaymentGatewaySeeder` exactly, including the sort order the
 * seeder assigns (telcell 2, ineco 3, converse 4) so a future `db:seed` is a
 * no-op rather than a reshuffle.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('payment_gateways')->updateOrInsert(
            ['name' => 'telcell'],
            [
                'display_name' => json_encode(
                    ['hy' => 'Telcell', 'en' => 'Telcell', 'ru' => 'Telcell'],
                    JSON_UNESCAPED_UNICODE
                ),
                'description' => json_encode([
                    'hy' => 'Վճարում Telcell Wallet-ով',
                    'en' => 'Pay with Telcell Wallet',
                    'ru' => 'Оплата через Telcell Wallet',
                ], JSON_UNESCAPED_UNICODE),
                'instructions' => json_encode([
                    'hy' => 'Կհղվեք Telcell-ի վճարային էջ:',
                    'en' => 'You will be redirected to Telcell to complete payment.',
                    'ru' => 'Вы будете перенаправлены на страницу оплаты Telcell.',
                ], JSON_UNESCAPED_UNICODE),
                'is_active'            => true,
                'is_sandbox_available' => true,
                'required_fields'      => json_encode([
                    ['key' => 'issuer',     'label_hy' => 'Խանութի էլ. հասցե',        'label_en' => 'Shop email (issuer)'],
                    ['key' => 'shop_key',   'label_hy' => 'Գաղտնի բանալի (shop key)', 'label_en' => 'Shop key'],
                    ['key' => 'valid_days', 'label_hy' => 'Վավերականությունը (օր)',    'label_en' => 'Invoice validity (days)'],
                ], JSON_UNESCAPED_UNICODE),
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // Keep the placeholders behind Telcell, matching the seeder's ordering.
        DB::table('payment_gateways')->where('name', 'ineco')->update(['sort_order' => 3]);
        DB::table('payment_gateways')->where('name', 'converse')->update(['sort_order' => 4]);
    }

    public function down(): void
    {
        // Only remove the row if no store ever configured it, so a rollback can
        // never orphan a seller's encrypted credentials.
        $id = DB::table('payment_gateways')->where('name', 'telcell')->value('id');

        if ($id && ! DB::table('store_payment_gateways')->where('payment_gateway_id', $id)->exists()) {
            DB::table('payment_gateways')->where('id', $id)->delete();
        }
    }
};
