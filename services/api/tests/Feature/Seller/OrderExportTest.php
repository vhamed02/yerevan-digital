<?php

namespace Tests\Feature\Seller;

use App\Enums\OrderStatus;
use App\Jobs\ExportOrdersJob;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Notifications\OrdersExportedNotification;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class OrderExportTest extends TestCase
{
    use RefreshDatabase;

    private User  $seller;
    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->seller = User::factory()->seller()->create();
        $this->seller->assignRole('seller');
        $this->store  = Store::factory()->create(['user_id' => $this->seller->id]);
    }

    private function actingAsSeller(): static
    {
        return $this->actingAs($this->seller, 'sanctum');
    }

    public function test_export_endpoint_dispatches_job(): void
    {
        Queue::fake();

        $this->actingAsSeller()
            ->getJson('/api/v1/seller/orders/export')
            ->assertOk();

        Queue::assertPushed(ExportOrdersJob::class, function (ExportOrdersJob $job) {
            return $job->storeId === $this->store->id
                && $job->userId  === $this->seller->id;
        });
    }

    public function test_export_endpoint_passes_filters_to_job(): void
    {
        Queue::fake();

        $this->actingAsSeller()
            ->getJson('/api/v1/seller/orders/export?status=pending&date_from=2025-01-01')
            ->assertOk();

        Queue::assertPushed(ExportOrdersJob::class, function (ExportOrdersJob $job) {
            return $job->filters['status']    === 'pending'
                && $job->filters['date_from'] === '2025-01-01';
        });
    }

    public function test_export_endpoint_requires_seller_auth(): void
    {
        $this->getJson('/api/v1/seller/orders/export')
            ->assertUnauthorized();
    }

    public function test_job_sends_notification_with_csv_attachment(): void
    {
        Notification::fake();

        Order::factory()->count(3)->create(['store_id' => $this->store->id]);

        (new ExportOrdersJob($this->store->id, $this->seller->id))->handle();

        Notification::assertSentTo($this->seller, OrdersExportedNotification::class);
    }

    public function test_job_does_nothing_when_user_not_found(): void
    {
        Notification::fake();

        (new ExportOrdersJob($this->store->id, 99999))->handle();

        Notification::assertNothingSent();
    }

    public function test_job_does_nothing_when_store_not_found(): void
    {
        Notification::fake();

        (new ExportOrdersJob(99999, $this->seller->id))->handle();

        Notification::assertNothingSent();
    }

    public function test_csv_contains_header_and_order_rows(): void
    {
        Notification::fake();

        Order::factory()->count(2)->create([
            'store_id'      => $this->store->id,
            'customer_name' => 'Hayk Petrosyan',
        ]);

        (new ExportOrdersJob($this->store->id, $this->seller->id))->handle();

        Notification::assertSentTo(
            $this->seller,
            OrdersExportedNotification::class,
            function (OrdersExportedNotification $notification) {
                $mail = $notification->toMail($this->seller);
                $attachData = collect($mail->rawAttachments)->first();

                $this->assertNotNull($attachData);
                $this->assertStringContainsString('Order #', $attachData['data']);
                $this->assertStringContainsString('Hayk Petrosyan', $attachData['data']);
                $this->assertEquals('text/csv', $attachData['options']['mime']);

                $lines = array_filter(explode("\n", trim($attachData['data'])));
                $this->assertCount(3, $lines);

                return true;
            }
        );
    }

    public function test_csv_respects_status_filter(): void
    {
        Notification::fake();

        Order::factory()->count(2)->create([
            'store_id' => $this->store->id,
            'status'   => OrderStatus::Pending,
        ]);
        Order::factory()->paid()->create(['store_id' => $this->store->id]);

        (new ExportOrdersJob(
            $this->store->id,
            $this->seller->id,
            ['status' => 'pending']
        ))->handle();

        Notification::assertSentTo(
            $this->seller,
            OrdersExportedNotification::class,
            function (OrdersExportedNotification $notification) {
                $mail       = $notification->toMail($this->seller);
                $attachData = collect($mail->rawAttachments)->first();
                $lines      = array_filter(explode("\n", trim($attachData['data'])));

                $this->assertCount(3, $lines);

                return true;
            }
        );
    }
}
