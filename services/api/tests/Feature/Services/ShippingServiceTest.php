<?php

namespace Tests\Feature\Services;

use App\Models\ShippingZone;
use App\Models\Store;
use App\Services\ShippingService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShippingServiceTest extends TestCase
{
    use RefreshDatabase;

    private ShippingService $service;
    private Store           $store;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        $this->service = app(ShippingService::class);
        $this->store   = Store::factory()->create();
    }

    public function test_a_store_with_no_zones_ships_free(): void
    {
        $quote = $this->service->quote($this->store->id, 'Yerevan', '20000.00');

        $this->assertSame('0.00', $quote['cost']);
        $this->assertNull($quote['zone']);
        $this->assertSame('no_zones', $quote['free_reason']);
    }

    public function test_matching_city_uses_that_zones_rate(): void
    {
        ShippingZone::factory()->create(['store_id' => $this->store->id, 'rate' => 1000]);

        $quote = $this->service->quote($this->store->id, 'Yerevan', '20000.00');

        $this->assertSame('1000.00', $quote['cost']);
    }

    public function test_city_matching_ignores_case_and_padding(): void
    {
        ShippingZone::factory()->create(['store_id' => $this->store->id, 'rate' => 1000]);

        $this->assertSame('1000.00', $this->service->quote($this->store->id, '  yEREVAN ', '20000.00')['cost']);
    }

    public function test_an_unlisted_city_falls_back_to_the_default_zone(): void
    {
        ShippingZone::factory()->create(['store_id' => $this->store->id, 'rate' => 1000]);
        ShippingZone::factory()->fallback()->create(['store_id' => $this->store->id, 'rate' => 2500]);

        $quote = $this->service->quote($this->store->id, 'Gyumri', '20000.00');

        $this->assertSame('2500.00', $quote['cost']);
        $this->assertTrue($quote['zone']->is_default);
    }

    public function test_an_unlisted_city_with_no_default_zone_ships_free(): void
    {
        ShippingZone::factory()->create(['store_id' => $this->store->id, 'rate' => 1000]);

        $this->assertSame('0.00', $this->service->quote($this->store->id, 'Gyumri', '20000.00')['cost']);
    }

    public function test_free_over_threshold_waives_the_rate(): void
    {
        ShippingZone::factory()->create([
            'store_id'  => $this->store->id,
            'rate'      => 1000,
            'free_over' => 15000,
        ]);

        $this->assertSame('0.00', $this->service->quote($this->store->id, 'Yerevan', '15000.00')['cost']);
        $this->assertSame('free_over', $this->service->quote($this->store->id, 'Yerevan', '20000.00')['free_reason']);
        $this->assertSame('1000.00', $this->service->quote($this->store->id, 'Yerevan', '14999.99')['cost']);
    }

    public function test_inactive_zones_are_ignored(): void
    {
        ShippingZone::factory()->create([
            'store_id'  => $this->store->id,
            'rate'      => 1000,
            'is_active' => false,
        ]);

        $this->assertSame('0.00', $this->service->quote($this->store->id, 'Yerevan', '20000.00')['cost']);
    }

    public function test_zones_are_scoped_to_their_store(): void
    {
        ShippingZone::factory()->create(['store_id' => $this->store->id, 'rate' => 1000]);
        $other = Store::factory()->create();

        $this->assertSame('0.00', $this->service->quote($other->id, 'Yerevan', '20000.00')['cost']);
    }

    public function test_a_null_city_falls_back_to_the_default_zone(): void
    {
        ShippingZone::factory()->fallback()->create(['store_id' => $this->store->id, 'rate' => 2500]);

        $this->assertSame('2500.00', $this->service->quote($this->store->id, null, '20000.00')['cost']);
    }
}
