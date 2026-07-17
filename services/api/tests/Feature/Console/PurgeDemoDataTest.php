<?php

namespace Tests\Feature\Console;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductReview;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class PurgeDemoDataTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $keeperSeller;
    private Store $keeperStore;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->admin = User::factory()->create([
            'email' => 'admin@yerevan.digital',
            'role'  => UserRole::SuperAdmin,
        ]);
        $this->admin->assignRole('super-admin');

        $this->keeperSeller = User::factory()->create([
            'email' => 'real-seller@example.com',
            'role'  => UserRole::Seller,
        ]);
        $this->keeperSeller->assignRole('seller');
        $this->keeperStore = Store::factory()->create(['user_id' => $this->keeperSeller->id]);
        Product::factory()->create(['store_id' => $this->keeperStore->id]);
        Order::factory()->create(['store_id' => $this->keeperStore->id]);
    }

    private function createSellerWithFullGraph(string $email): array
    {
        $seller = User::factory()->create(['email' => $email, 'role' => UserRole::Seller]);
        $seller->assignRole('seller');

        $store   = Store::factory()->create(['user_id' => $seller->id]);
        $product = Product::factory()->create(['store_id' => $store->id]);

        ProductImage::create([
            'product_id'     => $product->id,
            'path_original'  => 'https://example.com/o.jpg',
            'path_thumbnail' => 'https://example.com/t.jpg',
            'path_medium'    => 'https://example.com/m.jpg',
            'path_large'     => 'https://example.com/l.jpg',
            'sort_order'     => 0,
            'is_primary'     => true,
        ]);

        ProductVariant::create([
            'product_id' => $product->id,
            'name'       => ['hy' => 'Տարբերակ', 'en' => 'Variant'],
            'stock'      => 5,
            'attributes' => ['size' => 'M'],
            'is_active'  => true,
        ]);

        ProductReview::factory()->create([
            'store_id'   => $store->id,
            'product_id' => $product->id,
        ]);

        $order = Order::factory()->create(['store_id' => $store->id]);

        OrderItem::factory()->create([
            'order_id'   => $order->id,
            'product_id' => $product->id,
        ]);

        DB::table('transactions')->insert([
            'uuid'               => (string) Str::uuid(),
            'order_id'           => $order->id,
            'store_id'           => $store->id,
            'payment_gateway_id' => PaymentGateway::factory()->create()->id,
            'amount'             => 1000,
            'currency'           => 'AMD',
            'status'             => 'pending',
            'initiated_at'       => now(),
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        DB::table('notifications')->insert([
            'id'              => (string) Str::uuid(),
            'type'            => 'App\\Notifications\\NewOrderNotification',
            'notifiable_type' => User::class,
            'notifiable_id'   => $seller->id,
            'data'            => '{}',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $seller->createToken('test-token');

        DB::table('audits')->insert([
            'event'          => 'created',
            'auditable_type' => Store::class,
            'auditable_id'   => $store->id,
            'old_values'     => '{}',
            'new_values'     => '{}',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return [$seller, $store, $product, $order];
    }

    public function test_purges_demo_sellers_and_all_related_data(): void
    {
        [$seller, $store, $product, $order] = $this->createSellerWithFullGraph('hayk@yerevan-tech.am');

        $this->artisan('demo:purge', ['--force' => true])->assertSuccessful();

        $this->assertDatabaseMissing('users', ['id' => $seller->id]);
        $this->assertDatabaseMissing('stores', ['id' => $store->id]);
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertDatabaseCount('transactions', 0);
        $this->assertDatabaseCount('product_reviews', 0);
        $this->assertDatabaseCount('product_images', 0);
        $this->assertDatabaseCount('product_variants', 0);
        $this->assertDatabaseMissing('notifications', ['notifiable_id' => $seller->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $seller->id]);
        $this->assertDatabaseMissing('model_has_roles', ['model_id' => $seller->id]);
        $this->assertDatabaseMissing('audits', ['auditable_id' => $store->id, 'auditable_type' => Store::class]);
    }

    public function test_keeps_unrelated_sellers_and_platform_data(): void
    {
        $this->createSellerWithFullGraph('nune@armfashion.am');

        $this->artisan('demo:purge', ['--force' => true])->assertSuccessful();

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
        $this->assertDatabaseHas('users', ['id' => $this->keeperSeller->id]);
        $this->assertDatabaseHas('stores', ['id' => $this->keeperStore->id]);
        $this->assertSame(1, DB::table('products')->where('store_id', $this->keeperStore->id)->count());
        $this->assertSame(1, DB::table('orders')->where('store_id', $this->keeperStore->id)->count());
        $this->assertTrue($this->keeperSeller->fresh()->hasRole('seller'));
    }

    public function test_purges_soft_deleted_demo_data(): void
    {
        [$seller, $store] = $this->createSellerWithFullGraph('demo1@yerevan.digital');
        $store->delete();
        $seller->delete();

        $this->artisan('demo:purge', ['--force' => true])->assertSuccessful();

        $this->assertDatabaseMissing('users', ['id' => $seller->id]);
        $this->assertDatabaseMissing('stores', ['id' => $store->id]);
    }

    public function test_extra_users_are_purged_via_option(): void
    {
        [$extra, $extraStore] = $this->createSellerWithFullGraph('manual-test@example.com');

        $this->artisan('demo:purge', ['--force' => true, '--user' => ['manual-test@example.com']])
            ->assertSuccessful();

        $this->assertDatabaseMissing('users', ['id' => $extra->id]);
        $this->assertDatabaseMissing('stores', ['id' => $extraStore->id]);
        $this->assertDatabaseHas('users', ['id' => $this->keeperSeller->id]);
    }

    public function test_never_purges_super_admins(): void
    {
        $this->artisan('demo:purge', ['--force' => true, '--user' => ['admin@yerevan.digital']])
            ->assertSuccessful();

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
        $this->assertTrue($this->admin->fresh()->hasRole('super-admin'));
    }

    public function test_dry_run_deletes_nothing(): void
    {
        [$seller, $store] = $this->createSellerWithFullGraph('gor@ararat-foods.am');

        $this->artisan('demo:purge', ['--dry-run' => true])->assertSuccessful();

        $this->assertDatabaseHas('users', ['id' => $seller->id]);
        $this->assertDatabaseHas('stores', ['id' => $store->id]);
        $this->assertSame(1, DB::table('transactions')->count());
    }
}
