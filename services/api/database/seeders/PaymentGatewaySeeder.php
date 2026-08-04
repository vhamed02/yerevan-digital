<?php

namespace Database\Seeders;

use App\Models\PaymentGateway;
use Illuminate\Database\Seeder;

class PaymentGatewaySeeder extends Seeder
{
    public function run(): void
    {
        $gateways = [
            [
                'name'                 => 'idram',
                'display_name'         => ['hy' => 'iDram', 'en' => 'iDram', 'ru' => 'iDram'],
                'description'          => ['hy' => 'Վճարում iDram դրամապանակով կամ բանկային քարտով', 'en' => 'Pay with an iDram wallet or a bank card', 'ru' => 'Оплата кошельком iDram или банковской картой'],
                'instructions'         => [
                    'hy' => 'Կնքեք պայմանագիր Idram-ի հետ (developer@idram.am) և կստանաք ձեր Idram ID-ն ու գաղտնի բանալին։ Idram-ին պետք է հաղորդեք ներքևում նշված երեք հասցեները (RESULT, SUCCESS, FAIL) — առանց դրանց վճարումները չեն աշխատի։',
                    'en' => 'Sign a merchant agreement with Idram (developer@idram.am) to receive your Idram ID and Secret Key. You must also give Idram the three URLs shown below (RESULT, SUCCESS, FAIL) — payments will not work until they are registered.',
                    'ru' => 'Заключите договор с Idram (developer@idram.am), чтобы получить свой Idram ID и секретный ключ. Также передайте Idram три адреса, указанных ниже (RESULT, SUCCESS, FAIL) — без них платежи не заработают.',
                ],
                'is_active'            => true,
                'is_sandbox_available' => true,
                'required_fields'      => [
                    ['key' => 'rec_account', 'label_hy' => 'Idram ID (EDP_REC_ACCOUNT)', 'label_en' => 'Idram ID (EDP_REC_ACCOUNT)'],
                    ['key' => 'secret_key',  'label_hy' => 'Գաղտնի բանալի',              'label_en' => 'Secret key'],
                ],
                'sort_order'           => 1,
            ],
            [
                'name'                 => 'telcell',
                'display_name'         => ['hy' => 'Telcell', 'en' => 'Telcell', 'ru' => 'Telcell'],
                'description'          => ['hy' => 'Վճարում Telcell Wallet-ով', 'en' => 'Pay with Telcell Wallet', 'ru' => 'Оплата через Telcell Wallet'],
                'instructions'         => ['hy' => 'Կհղվեք Telcell-ի վճարային էջ:', 'en' => 'You will be redirected to Telcell to complete payment.', 'ru' => 'Вы будете перенаправлены на страницу оплаты Telcell.'],
                'is_active'            => true,
                'is_sandbox_available' => true,
                'required_fields'      => [
                    ['key' => 'issuer',     'label_hy' => 'Խանութի էլ. հասցե',        'label_en' => 'Shop email (issuer)'],
                    ['key' => 'shop_key',   'label_hy' => 'Գաղտնի բանալի (shop key)', 'label_en' => 'Shop key'],
                    ['key' => 'valid_days', 'label_hy' => 'Վավերականությունը (օր)',    'label_en' => 'Invoice validity (days)'],
                ],
                'sort_order'           => 2,
            ],
            [
                'name'                 => 'ineco',
                'display_name'         => ['hy' => 'Ինեկոբանկ', 'en' => 'Inecobank'],
                'description'          => ['hy' => 'Վճարում Ինեկոբանկի քարտով', 'en' => 'Pay with Inecobank card'],
                'instructions'         => ['hy' => 'Կհղվեք Ինեկոբանկի վճարային էջ:', 'en' => 'You will be redirected to the Inecobank payment page.'],
                'is_active'            => false,
                'is_sandbox_available' => true,
                'required_fields'      => ['merchant_id', 'merchant_password', 'merchant_name'],
                'sort_order'           => 3,
            ],
            [
                'name'                 => 'converse',
                'display_name'         => ['hy' => 'Կոնվերս Բանկ', 'en' => 'Converse Bank'],
                'description'          => ['hy' => 'Վճարում Կոնվերս Բանկի քարտով', 'en' => 'Pay with Converse Bank card'],
                'instructions'         => ['hy' => 'Կհղվեք Կոնվերս Բանկի վճարային էջ:', 'en' => 'You will be redirected to the Converse Bank payment page.'],
                'is_active'            => false,
                'is_sandbox_available' => true,
                'required_fields'      => ['username', 'password'],
                'sort_order'           => 4,
            ],
        ];

        foreach ($gateways as $gateway) {
            PaymentGateway::updateOrCreate(['name' => $gateway['name']], $gateway);
        }
    }
}
