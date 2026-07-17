<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class PurgeDemoData extends Command
{
    protected $signature = 'demo:purge
        {--user=* : Extra user emails to purge along with the demo accounts}
        {--dry-run : Report what would be deleted without deleting anything}
        {--force : Skip the confirmation prompt}';

    protected $description = 'Permanently delete demo sellers, their stores, and every related row';

    private const DEMO_EMAILS = [
        'demo1@yerevan.digital',
        'demo2@yerevan.digital',
        'demo3@yerevan.digital',
        'hayk@yerevan-tech.am',
        'nune@armfashion.am',
        'gor@ararat-foods.am',
        'mariam@sevan-beauty.am',
        'armen@artisan-am.am',
        'tigran@sportmax.am',
    ];

    public function handle(): int
    {
        $emails = collect(self::DEMO_EMAILS)
            ->merge((array) $this->option('user'))
            ->unique()
            ->values();

        $userIds = DB::table('users')
            ->whereIn('email', $emails)
            ->where('role', '!=', UserRole::SuperAdmin->value)
            ->pluck('id');

        $storeIds   = DB::table('stores')->whereIn('user_id', $userIds)->pluck('id');
        $productIds = DB::table('products')->whereIn('store_id', $storeIds)->pluck('id');
        $orderIds   = DB::table('orders')->whereIn('store_id', $storeIds)->pluck('id');

        if ($userIds->isEmpty() && $storeIds->isEmpty()) {
            $this->info('Nothing to purge.');

            return self::SUCCESS;
        }

        $plan = $this->buildPlan($emails, $userIds, $storeIds, $productIds, $orderIds);

        $this->table(['Table', 'Rows to delete'], collect($plan)->map(
            fn (int $count, string $table) => [$table, $count]
        )->values()->all());

        if ($this->option('dry-run')) {
            $this->info('Dry run — nothing was deleted.');

            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm('Permanently delete all rows listed above?')) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($emails, $userIds, $storeIds, $productIds, $orderIds): void {
            DB::table('order_items')->whereIn('order_id', $orderIds)->delete();
            DB::table('wishlist_items')->whereIn('product_id', $productIds)->delete();
            DB::table('commissions')->whereIn('store_id', $storeIds)->delete();
            DB::table('shipping_zones')->whereIn('store_id', $storeIds)->delete();
            DB::table('transactions')->whereIn('store_id', $storeIds)->delete();
            DB::table('product_reviews')->whereIn('store_id', $storeIds)->delete();
            DB::table('product_images')->whereIn('product_id', $productIds)->delete();
            DB::table('product_variants')->whereIn('product_id', $productIds)->delete();
            DB::table('orders')->whereIn('id', $orderIds)->delete();
            // After orders: orders.coupon_id points here (null on delete).
            DB::table('coupons')->whereIn('store_id', $storeIds)->delete();
            DB::table('products')->whereIn('id', $productIds)->delete();
            DB::table('store_payment_gateways')->whereIn('store_id', $storeIds)->delete();
            DB::table('store_settings')->whereIn('store_id', $storeIds)->delete();
            DB::table('commission_invoices')->whereIn('store_id', $storeIds)->delete();
            DB::table('stores')->whereIn('id', $storeIds)->delete();
            DB::table('notifications')
                ->where('notifiable_type', User::class)
                ->whereIn('notifiable_id', $userIds)
                ->delete();
            DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)
                ->whereIn('tokenable_id', $userIds)
                ->delete();
            DB::table('model_has_roles')
                ->where('model_type', User::class)
                ->whereIn('model_id', $userIds)
                ->delete();
            DB::table('password_reset_tokens')->whereIn('email', $emails)->delete();
            DB::table('sessions')->whereIn('user_id', $userIds)->delete();
            DB::table('audits')
                ->where(function ($q) use ($userIds, $storeIds): void {
                    $q->where(fn ($a) => $a->where('auditable_type', Store::class)->whereIn('auditable_id', $storeIds))
                        ->orWhere(fn ($a) => $a->where('auditable_type', User::class)->whereIn('auditable_id', $userIds))
                        ->orWhereIn('user_id', $userIds);
                })
                ->delete();
            DB::table('orders')->whereIn('customer_id', $userIds)->update(['customer_id' => null]);
            DB::table('users')->whereIn('id', $userIds)->delete();
        });

        $this->purgeMongoTemplateConfigs($storeIds);

        Artisan::call('cache:clear');
        $this->info('Cache cleared.');

        $this->info(sprintf(
            'Purged %d users, %d stores, %d products, %d orders and all related rows.',
            $userIds->count(),
            $storeIds->count(),
            $productIds->count(),
            $orderIds->count()
        ));

        return self::SUCCESS;
    }

    private function buildPlan(
        Collection $emails,
        Collection $userIds,
        Collection $storeIds,
        Collection $productIds,
        Collection $orderIds
    ): array {
        return [
            'order_items'            => DB::table('order_items')->whereIn('order_id', $orderIds)->count(),
            'wishlist_items'         => DB::table('wishlist_items')->whereIn('product_id', $productIds)->count(),
            'commissions'            => DB::table('commissions')->whereIn('store_id', $storeIds)->count(),
            'coupons'                => DB::table('coupons')->whereIn('store_id', $storeIds)->count(),
            'shipping_zones'         => DB::table('shipping_zones')->whereIn('store_id', $storeIds)->count(),
            'transactions'           => DB::table('transactions')->whereIn('store_id', $storeIds)->count(),
            'product_reviews'        => DB::table('product_reviews')->whereIn('store_id', $storeIds)->count(),
            'product_images'         => DB::table('product_images')->whereIn('product_id', $productIds)->count(),
            'product_variants'       => DB::table('product_variants')->whereIn('product_id', $productIds)->count(),
            'orders'                 => $orderIds->count(),
            'products'               => $productIds->count(),
            'store_payment_gateways' => DB::table('store_payment_gateways')->whereIn('store_id', $storeIds)->count(),
            'store_settings'         => DB::table('store_settings')->whereIn('store_id', $storeIds)->count(),
            'commission_invoices'    => DB::table('commission_invoices')->whereIn('store_id', $storeIds)->count(),
            'stores'                 => $storeIds->count(),
            'notifications'          => DB::table('notifications')->where('notifiable_type', User::class)->whereIn('notifiable_id', $userIds)->count(),
            'personal_access_tokens' => DB::table('personal_access_tokens')->where('tokenable_type', User::class)->whereIn('tokenable_id', $userIds)->count(),
            'model_has_roles'        => DB::table('model_has_roles')->where('model_type', User::class)->whereIn('model_id', $userIds)->count(),
            'password_reset_tokens'  => DB::table('password_reset_tokens')->whereIn('email', $emails)->count(),
            'sessions'               => DB::table('sessions')->whereIn('user_id', $userIds)->count(),
            'audits'                 => DB::table('audits')
                ->where(function ($q) use ($userIds, $storeIds): void {
                    $q->where(fn ($a) => $a->where('auditable_type', Store::class)->whereIn('auditable_id', $storeIds))
                        ->orWhere(fn ($a) => $a->where('auditable_type', User::class)->whereIn('auditable_id', $userIds))
                        ->orWhereIn('user_id', $userIds);
                })->count(),
            'users'                  => $userIds->count(),
        ];
    }

    private function purgeMongoTemplateConfigs(Collection $storeIds): void
    {
        try {
            DB::connection('mongodb')
                ->table('store_template_configs')
                ->whereIn('store_id', $storeIds->all())
                ->delete();
        } catch (\Throwable $e) {
            $this->warn('MongoDB template-config cleanup skipped: ' . $e->getMessage());
        }
    }
}
