<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Store;
use App\Models\StorePaymentGateway;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    private array $artisanProducts = [
        ['hy' => 'Ձեռագործ կերամիկական ամաններ',    'en' => 'Handmade Ceramic Bowls'],
        ['hy' => 'Մեղրամոմե մոմ Set',                'en' => 'Beeswax Candle Set'],
        ['hy' => 'Հայկական կերամիկական ծաղկամաններ', 'en' => 'Armenian Ceramic Vases'],
        ['hy' => 'Ձեռագործ բամբակյա գդալ',           'en' => 'Handwoven Cotton Tapestry'],
        ['hy' => 'Ձիթապտղի կտրատ',                   'en' => 'Olive Wood Cutting Board'],
        ['hy' => 'Ծաղրածուի հնչյուն',                'en' => 'Clay Wind Chimes'],
        ['hy' => 'Ներկված մետաքսյա շարֆ',            'en' => 'Hand-painted Silk Scarf'],
        ['hy' => 'Հայկական Omenամ գունավոր',          'en' => 'Armenian Ornament Set'],
        ['hy' => 'Կաշեգործ փոքր պայուսակ',           'en' => 'Handcrafted Leather Pouch'],
        ['hy' => 'Ձեռագործ Macramé ծաղկաման',        'en' => 'Macramé Plant Hanger'],
        ['hy' => 'Կավե թաս հավաքածու',               'en' => 'Ceramic Mug Collection'],
        ['hy' => 'Կտorenic կտavé',                    'en' => 'Linen Embroidery Hoop Art'],
        ['hy' => 'Կղmotif՟ apa',                      'en' => 'Pressed Flower Bookmark Set'],
        ['hy' => 'Հայktaian Felt amsagrk',            'en' => 'Handcrafted Felt Ornaments'],
        ['hy' => 'Ximag Mosaic Art Panel',             'en' => 'Stone Mosaic Art Panel'],
    ];

    private array $fashionProducts = [
        ['hy' => 'Բամbakya blusek',             'en' => 'Cotton Linen Blouse'],
        ['hy' => 'Նուrbé kish chapat',           'en' => 'Slim Fit Chinos'],
        ['hy' => 'Handmade ոutu kra',            'en' => 'Handknit Wool Sweater'],
        ['hy' => 'Velvety dress gisherk',        'en' => 'Velvet Midi Dress'],
        ['hy' => 'Bazmaguyn casual jacket',      'en' => 'Casual Denim Jacket'],
        ['hy' => 'Elegant evening gown',         'en' => 'Elegant Evening Gown'],
        ['hy' => 'Sport jogger kros',            'en' => 'Sport Jogger Pants'],
        ['hy' => 'Armenian print t-shirt',       'en' => 'Armenian Print T-Shirt'],
        ['hy' => 'Floral summer dress',          'en' => 'Floral Summer Dress'],
        ['hy' => 'Classic wool coat',            'en' => 'Classic Wool Coat'],
        ['hy' => 'Leather belt accessories',     'en' => 'Leather Belt Set'],
        ['hy' => 'Silk kimono robe',             'en' => 'Silk Kimono Robe'],
        ['hy' => 'High-waist jeans modern',      'en' => 'High-Waist Jeans'],
        ['hy' => 'Embroidered kurta top',        'en' => 'Embroidered Kurta Top'],
        ['hy' => 'Linen cargo pants summer',     'en' => 'Linen Cargo Pants'],
    ];

    private array $techProducts = [
        ['hy' => 'Անlares Bluetooth speaker',        'en' => 'Portable Bluetooth Speaker'],
        ['hy' => 'USB-C Hub 7-in-1',                 'en' => 'USB-C Hub 7-in-1'],
        ['hy' => 'Wireless charging pad',            'en' => 'Wireless Charging Pad'],
        ['hy' => 'Mechanical keyboard RGB',          'en' => 'Mechanical Keyboard RGB'],
        ['hy' => 'Ergonomic mouse wireless',         'en' => 'Ergonomic Wireless Mouse'],
        ['hy' => 'Monitor arm dual',                 'en' => 'Dual Monitor Arm'],
        ['hy' => 'LED desk lamp smart',              'en' => 'Smart LED Desk Lamp'],
        ['hy' => 'Noise cancelling headphones',      'en' => 'Noise-Cancelling Headphones'],
        ['hy' => 'Webcam 4K HD streaming',           'en' => '4K HD Webcam'],
        ['hy' => 'SSD External 1TB portable',        'en' => 'Portable 1TB SSD'],
        ['hy' => 'Smart plug WiFi outlet',           'en' => 'Smart WiFi Plug'],
        ['hy' => 'Cable management box',             'en' => 'Cable Management Box'],
        ['hy' => 'Phone stand adjustable',           'en' => 'Adjustable Phone Stand'],
        ['hy' => 'Laptop cooling pad 15in',          'en' => 'Laptop Cooling Pad 15"'],
        ['hy' => 'USB microphone podcast',           'en' => 'USB Podcast Microphone'],
    ];

    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            SuperAdminSeeder::class,
            PaymentGatewaySeeder::class,
            CategorySeeder::class,
            StoreTemplateSeeder::class,
        ]);

        $idram = PaymentGateway::where('name', 'idram')->firstOrFail();

        $demos = [
            [
                'email'    => 'demo1@vendora.am',
                'name'     => 'Armen Petrosyan',
                'slug'     => 'demo-artisan',
                'template' => 'elegant',
                'category' => 'other',
                'products' => $this->artisanProducts,
            ],
            [
                'email'    => 'demo2@vendora.am',
                'name'     => 'Ani Mkrtchyan',
                'slug'     => 'demo-fashion',
                'template' => 'bold',
                'category' => 'clothing',
                'products' => $this->fashionProducts,
            ],
            [
                'email'    => 'demo3@vendora.am',
                'name'     => 'Tigran Harutyunyan',
                'slug'     => 'demo-tech',
                'template' => 'minimal',
                'category' => 'electronics',
                'products' => $this->techProducts,
            ],
        ];

        foreach ($demos as $demo) {
            $seller = $this->createSeller($demo['email'], $demo['name']);
            $store  = $this->createStore($seller, $demo['slug'], $demo['template']);
            $this->configureIdram($store, $idram);

            $categorySlug = $demo['category'];
            $category     = Category::where('slug', $categorySlug)->first();

            $products = $this->createProducts($store, $demo['products'], $category);
            $this->createOrders($store, $products);
        }
    }

    private function createSeller(string $email, string $name): User
    {
        $seller = User::firstOrCreate(
            ['email' => $email],
            [
                'name'              => $name,
                'password'          => Hash::make('password'),
                'role'              => UserRole::Seller,
                'status'            => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        if (!$seller->hasRole('seller')) {
            $seller->assignRole('seller');
        }

        return $seller;
    }

    private function createStore(User $seller, string $slug, string $template): Store
    {
        return Store::firstOrCreate(
            ['slug' => $slug],
            [
                'user_id'             => $seller->id,
                'name'                => ['hy' => ucfirst(str_replace('-', ' ', $slug)), 'en' => ucfirst(str_replace('-', ' ', $slug))],
                'description'         => ['hy' => 'Հայկական խանութ', 'en' => 'Armenian demo store'],
                'status'              => StoreStatus::Active,
                'active_template_key' => $template,
                'currency'            => 'AMD',
                'is_featured'         => true,
            ]
        );
    }

    private function configureIdram(Store $store, PaymentGateway $idram): void
    {
        StorePaymentGateway::firstOrCreate(
            ['store_id' => $store->id, 'payment_gateway_id' => $idram->id],
            [
                'is_enabled'  => true,
                'is_sandbox'  => true,
                'credentials' => ['account_id' => 'DEMO_' . strtoupper($store->slug), 'secret_key' => Str::random(32)],
            ]
        );
    }

    private function createProducts(Store $store, array $productNames, ?Category $category): array
    {
        $products = [];

        foreach ($productNames as $i => $name) {
            $slug    = Str::slug($name['en']) . '-' . $store->slug;
            $price   = fake()->numberBetween(1000, 50000);

            $product = Product::firstOrCreate(
                ['store_id' => $store->id, 'slug' => $slug],
                [
                    'category_id'   => $category?->id,
                    'name'          => $name,
                    'description'   => ['hy' => fake()->sentence(10), 'en' => fake()->sentence(10)],
                    'slug'          => $slug,
                    'price'         => $price,
                    'stock'         => fake()->numberBetween(5, 100),
                    'manage_stock'  => true,
                    'status'        => ProductStatus::Active,
                    'is_featured'   => $i < 3,
                    'sort_order'    => $i,
                ]
            );

            if ($product->wasRecentlyCreated) {
                foreach ([1, 2] as $j) {
                    ProductImage::create([
                        'product_id'      => $product->id,
                        'path_original'   => "https://picsum.photos/seed/{$store->slug}{$i}{$j}/800/600",
                        'path_thumbnail'  => "https://picsum.photos/seed/{$store->slug}{$i}{$j}/200/200",
                        'path_medium'     => "https://picsum.photos/seed/{$store->slug}{$i}{$j}/400/400",
                        'path_large'      => "https://picsum.photos/seed/{$store->slug}{$i}{$j}/800/800",
                        'sort_order'      => $j - 1,
                        'is_primary'      => $j === 1,
                    ]);
                }
            }

            $products[] = $product;
        }

        return $products;
    }

    private function createOrders(Store $store, array $products): void
    {
        $customers = [
            ['name' => 'Anna Grigoryan',   'email' => 'anna@example.com',  'phone' => '+37491000001'],
            ['name' => 'Saro Hovhannisyan','email' => 'saro@example.com',  'phone' => '+37491000002'],
            ['name' => 'Nare Sargsyan',    'email' => 'nare@example.com',  'phone' => '+37491000003'],
            ['name' => 'Aram Abrahamyan',  'email' => 'aram@example.com',  'phone' => '+37491000004'],
            ['name' => 'Lilia Ter-Petrosyan', 'email' => 'lilia@example.com', 'phone' => '+37491000005'],
        ];

        foreach ($customers as $customer) {
            $product  = $products[array_rand($products)];
            $quantity = fake()->numberBetween(1, 3);
            $total    = $product->price * $quantity;

            $order = Order::create([
                'store_id'        => $store->id,
                'status'          => OrderStatus::Delivered,
                'payment_status'  => PaymentStatus::Paid,
                'subtotal'        => $total,
                'discount'        => 0,
                'shipping_cost'   => 0,
                'tax'             => 0,
                'total'           => $total,
                'currency'        => 'AMD',
                'customer_name'   => $customer['name'],
                'customer_email'  => $customer['email'],
                'customer_phone'  => $customer['phone'],
                'payment_method'  => 'idram',
                'shipping_address'=> [
                    'address'     => fake()->streetAddress(),
                    'city'        => 'Yerevan',
                    'postal_code' => '0001',
                    'country'     => 'Armenia',
                ],
                'paid_at'         => now()->subDays(fake()->numberBetween(1, 30)),
            ]);

            OrderItem::create([
                'order_id'     => $order->id,
                'product_id'   => $product->id,
                'product_name' => $product->getTranslations('name'),
                'quantity'     => $quantity,
                'unit_price'   => $product->price,
                'total_price'  => $total,
            ]);
        }
    }
}
