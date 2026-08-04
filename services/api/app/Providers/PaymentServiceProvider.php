<?php

namespace App\Providers;

use App\Services\PaymentGateway\Gateways\ConverseBankGateway;
use App\Services\PaymentGateway\Gateways\IdramGateway;
use App\Services\PaymentGateway\Gateways\InnecobankGateway;
use App\Services\PaymentGateway\Gateways\TelcellGateway;
use App\Services\PaymentGateway\PaymentGatewayRegistry;
use Illuminate\Support\ServiceProvider;

class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentGatewayRegistry::class, function () {
            $registry = new PaymentGatewayRegistry();
            // Keys MUST equal payment_gateways.name — Store\PaymentController
            // looks a store's gateway up by DB name, then fetches that same key
            // from this registry. 'ineco' / 'converse' were registered as
            // 'innecobank' / 'converse_bank' until 2026-08-04, so activating
            // either stub would have thrown "gateway is not registered".
            $registry->register('idram', new IdramGateway());
            $registry->register('telcell', new TelcellGateway());
            $registry->register('ineco', new InnecobankGateway());
            $registry->register('converse', new ConverseBankGateway());
            return $registry;
        });
    }
}
