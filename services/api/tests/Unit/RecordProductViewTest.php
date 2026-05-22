<?php

namespace Tests\Unit;

use App\Events\ProductViewed;
use App\Listeners\RecordProductView;
use App\Repositories\Contracts\ProductViewRepositoryInterface;
use Illuminate\Support\Facades\Cache;
use Mockery;
use Tests\TestCase;

class RecordProductViewTest extends TestCase
{
    private ProductViewRepositoryInterface $viewRepo;
    private RecordProductView $listener;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        $this->viewRepo = Mockery::mock(ProductViewRepositoryInterface::class);
        $this->listener = new RecordProductView($this->viewRepo);
    }

    public function test_first_view_from_ip_increments_count(): void
    {
        $this->viewRepo->shouldReceive('increment')->once()->with(5);

        $this->listener->handle(new ProductViewed(5, '1.2.3.4'));
    }

    public function test_second_view_from_same_ip_does_not_increment(): void
    {
        $this->viewRepo->shouldReceive('increment')->once()->with(5);

        $this->listener->handle(new ProductViewed(5, '1.2.3.4'));
        $this->listener->handle(new ProductViewed(5, '1.2.3.4'));
    }

    public function test_different_ips_both_increment(): void
    {
        $this->viewRepo->shouldReceive('increment')->twice()->with(5);

        $this->listener->handle(new ProductViewed(5, '1.2.3.4'));
        $this->listener->handle(new ProductViewed(5, '5.6.7.8'));
    }

    public function test_same_ip_different_products_both_increment(): void
    {
        $this->viewRepo->shouldReceive('increment')->once()->with(1);
        $this->viewRepo->shouldReceive('increment')->once()->with(2);

        $this->listener->handle(new ProductViewed(1, '1.2.3.4'));
        $this->listener->handle(new ProductViewed(2, '1.2.3.4'));
    }

    public function test_dedup_key_includes_product_id(): void
    {
        // Visiting product 1 from IP A should not block product 2 from the same IP
        $this->viewRepo->shouldReceive('increment')->with(1)->once();
        $this->viewRepo->shouldReceive('increment')->with(2)->once();

        $this->listener->handle(new ProductViewed(1, '1.2.3.4'));
        $this->listener->handle(new ProductViewed(2, '1.2.3.4'));
    }

    public function test_dedup_key_expires_after_12_hours(): void
    {
        $this->viewRepo->shouldReceive('increment')->twice()->with(5);

        $this->listener->handle(new ProductViewed(5, '1.2.3.4'));

        // Simulate key expiry by manually clearing it
        $key = 'pvw:5:' . hash('sha256', '1.2.3.4');
        Cache::forget($key);

        $this->listener->handle(new ProductViewed(5, '1.2.3.4'));
    }
}
