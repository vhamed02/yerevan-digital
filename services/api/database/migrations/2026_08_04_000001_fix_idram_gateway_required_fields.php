<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Re-sync the `idram` payment_gateways row with the real Idram protocol.
 *
 * Two things were wrong on the live row and neither is reachable by a deploy,
 * because `scripts/deploy.sh` runs `migrate --force` but never seeds:
 *
 *  1. `required_fields` used the flat legacy shape `['account_id','secret_key']`.
 *     Both the seller config UI and `Seller\PaymentController::configure()` read
 *     this column expecting `[{key,label_hy,label_en}]`, so the form rendered no
 *     inputs at all and Idram could not be configured by anyone.
 *  2. The key was `account_id`, while the gateway reads `rec_account` — Idram's
 *     documented EDP_REC_ACCOUNT.
 *
 * Existing stores keep working either way: IdramGateway::recipientFromCredentials()
 * still accepts the legacy `account_id` / `edp_id` keys already encrypted into
 * `store_payment_gateways.credentials`.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('payment_gateways')->where('name', 'idram')->update([
            'required_fields' => json_encode([
                ['key' => 'rec_account', 'label_hy' => 'Idram ID (EDP_REC_ACCOUNT)', 'label_en' => 'Idram ID (EDP_REC_ACCOUNT)'],
                ['key' => 'secret_key',  'label_hy' => 'Գաղտնի բանալի',              'label_en' => 'Secret key'],
            ], JSON_UNESCAPED_UNICODE),
            'instructions' => json_encode([
                'hy' => 'Կնքեք պայմանագիր Idram-ի հետ (developer@idram.am) և կստանաք ձեր Idram ID-ն ու գաղտնի բանալին։ Idram-ին պետք է հաղորդեք ներքևում նշված երեք հասցեները (RESULT, SUCCESS, FAIL) — առանց դրանց վճարումները չեն աշխատի։',
                'en' => 'Sign a merchant agreement with Idram (developer@idram.am) to receive your Idram ID and Secret Key. You must also give Idram the three URLs shown below (RESULT, SUCCESS, FAIL) — payments will not work until they are registered.',
                'ru' => 'Заключите договор с Idram (developer@idram.am), чтобы получить свой Idram ID и секретный ключ. Также передайте Idram три адреса, указанных ниже (RESULT, SUCCESS, FAIL) — без них платежи не заработают.',
            ], JSON_UNESCAPED_UNICODE),
            'description' => json_encode([
                'hy' => 'Վճարում iDram դրամապանակով կամ բանկային քարտով',
                'en' => 'Pay with an iDram wallet or a bank card',
                'ru' => 'Оплата кошельком iDram или банковской картой',
            ], JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('payment_gateways')->where('name', 'idram')->update([
            'required_fields' => json_encode(['account_id', 'secret_key']),
            'updated_at'      => now(),
        ]);
    }
};
