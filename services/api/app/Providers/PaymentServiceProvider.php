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
            $registry->register('idram', new IdramGateway());
            $registry->register('telcell', new TelcellGateway());
            $registry->register('innecobank', new InnecobankGateway());
            $registry->register('converse_bank', new ConverseBankGateway());
            return $registry;
        });
    }
}
