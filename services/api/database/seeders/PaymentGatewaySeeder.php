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
                'display_name'         => ['hy' => 'iDram', 'en' => 'iDram'],
                'description'          => ['hy' => 'Վճարում iDram-ով', 'en' => 'Pay with iDram'],
                'instructions'         => ['hy' => 'Ձեր iDram հաշիվը կօգտագործվի վճարման համար:', 'en' => 'Your iDram account will be used for payment.'],
                'is_active'            => true,
                'is_sandbox_available' => true,
                'required_fields'      => ['account_id', 'secret_key'],
                'sort_order'           => 1,
            ],
            [
                'name'                 => 'ineco',
                'display_name'         => ['hy' => 'Ինեկոբանկ', 'en' => 'Inecobank'],
                'description'          => ['hy' => 'Վճարում Ինեկոբանկի քարտով', 'en' => 'Pay with Inecobank card'],
                'instructions'         => ['hy' => 'Կհղվեք Ինեկոբանկի վճարային էջ:', 'en' => 'You will be redirected to the Inecobank payment page.'],
                'is_active'            => false,
                'is_sandbox_available' => true,
                'required_fields'      => ['merchant_id', 'merchant_password', 'merchant_name'],
                'sort_order'           => 2,
            ],
            [
                'name'                 => 'converse',
                'display_name'         => ['hy' => 'Կոնվերս Բանկ', 'en' => 'Converse Bank'],
                'description'          => ['hy' => 'Վճարում Կոնվերս Բանկի քարտով', 'en' => 'Pay with Converse Bank card'],
                'instructions'         => ['hy' => 'Կհղվեք Կոնվերս Բանկի վճարային էջ:', 'en' => 'You will be redirected to the Converse Bank payment page.'],
                'is_active'            => false,
                'is_sandbox_available' => true,
                'required_fields'      => ['username', 'password'],
                'sort_order'           => 3,
            ],
        ];

        foreach ($gateways as $gateway) {
            PaymentGateway::updateOrCreate(['name' => $gateway['name']], $gateway);
        }
    }
}
