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
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\StorePaymentGateway;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    // ─── Yerevan streets & districts ──────────────────────────────────────────
    private array $addresses = [
        ['street' => 'Աբովյան 12', 'district' => 'Կենտրոն'],
        ['street' => 'Բաղրամյան 24', 'district' => 'Կենտրոն'],
        ['street' => 'Տիգրանյան 5', 'district' => 'Արաբկիր'],
        ['street' => 'Կոմիտաս 45', 'district' => 'Քանաքեռ-Զեյթուն'],
        ['street' => 'Անաստաս Միկոյան 8', 'district' => 'Ավան'],
        ['street' => 'Շիրակի 17', 'district' => 'Շենգավիթ'],
        ['street' => 'Գայի 3', 'district' => 'Մալաթիա-Սեբաստիա'],
        ['street' => 'Արցախ 22', 'district' => 'Էրեբունի'],
        ['street' => 'Ազատության 56', 'district' => 'Ջրվեժ'],
        ['street' => 'Հանրապետության 7', 'district' => 'Կենտրոն'],
        ['street' => 'Շահինյան 33', 'district' => 'Նոր Նորք'],
        ['street' => 'Դավթաշեն 4-ՐԴ ՓՈՂ 11', 'district' => 'Դավթաշեն'],
    ];

    // ─── Realistic Armenian customer names ────────────────────────────────────
    private array $customers = [
        ['name' => 'Անի Հակոբյան',     'email' => 'ani.hakobyan@mail.am',    'phone' => '+37491234501'],
        ['name' => 'Վահե Սահակյան',    'email' => 'vahe.sahakyan@mail.am',   'phone' => '+37491234502'],
        ['name' => 'Մարինե Ավագյան',   'email' => 'marine.avagyan@mail.am',  'phone' => '+37493234503'],
        ['name' => 'Կարեն Բաղդասարյան','email' => 'karen.bagd@mail.am',      'phone' => '+37494234504'],
        ['name' => 'Սոնա Մկրտչյան',    'email' => 'sona.mkrtchyan@mail.am',  'phone' => '+37491234505'],
        ['name' => 'Արմեն Ղազարյան',   'email' => 'armen.ghazaryan@mail.am', 'phone' => '+37493234506'],
        ['name' => 'Լուսինե Դանիելյան', 'email' => 'lusine.d@mail.am',        'phone' => '+37491234507'],
        ['name' => 'Գրիգոր Ստեփանյան', 'email' => 'grigor.step@mail.am',     'phone' => '+37494234508'],
        ['name' => 'Նարե Գևորգյան',    'email' => 'nare.gevorgyan@mail.am',  'phone' => '+37493234509'],
        ['name' => 'Ռուբեն Պետրոսյան', 'email' => 'ruben.petrosyan@mail.am', 'phone' => '+37491234510'],
        ['name' => 'Թամարա Ամիրյան',   'email' => 'tamara.amiryan@mail.am',  'phone' => '+37494234511'],
        ['name' => 'Հայկ Կարապետյան',  'email' => 'hayk.karapetyan@mail.am', 'phone' => '+37493234512'],
    ];

    // ─── Store definitions ─────────────────────────────────────────────────────
    private function stores(): array
    {
        return [
            [
                'seller_name'  => 'Հայկ Սարգսյան',
                'seller_email' => 'hayk@yerevan-tech.am',
                'store_slug'   => 'yerevan-tech',
                'store_name'   => ['hy' => 'Երևան Տեք', 'en' => 'Yerevan Tech'],
                'description'  => [
                    'hy' => 'Որակյալ էլեկտրոնիկա և ակսեսուարներ լավագույն գներով Երևանում։',
                    'en' => 'Quality electronics and accessories at the best prices in Yerevan.',
                ],
                'category'     => 'electronics',
                'template'     => 'minimal',
                'is_featured'  => true,
                'phone'        => '+37410560001',
                'email'        => 'info@yerevan-tech.am',
                'address'      => 'Տիգրանյան 5, Երևան',
                'social_links' => ['instagram' => 'yerevan_tech', 'facebook' => 'yerevantech'],
                'products'     => $this->electronicsProducts(),
            ],
            [
                'seller_name'  => 'Նունե Պետրոսյան',
                'seller_email' => 'nune@armfashion.am',
                'store_slug'   => 'arm-fashion',
                'store_name'   => ['hy' => 'Արմ Մոդա', 'en' => 'Arm Fashion'],
                'description'  => [
                    'hy' => 'Հայկական ժամանակակից նորաձևություն։ Հայաստանում արտադրված, սրտով ստեղծված։',
                    'en' => 'Contemporary Armenian fashion. Made in Armenia, created with heart.',
                ],
                'category'     => 'clothing',
                'template'     => 'bold',
                'is_featured'  => true,
                'phone'        => '+37410560002',
                'email'        => 'hello@armfashion.am',
                'address'      => 'Աբովյան 12, Երևան',
                'social_links' => ['instagram' => 'arm_fashion', 'facebook' => 'armfashion'],
                'products'     => $this->fashionProducts(),
            ],
            [
                'seller_name'  => 'Գոռ Հակոբյան',
                'seller_email' => 'gor@ararat-foods.am',
                'store_slug'   => 'ararat-foods',
                'store_name'   => ['hy' => 'Արարատ Ֆուդ', 'en' => 'Ararat Foods'],
                'description'  => [
                    'hy' => 'Հայկական ավանդական մթերք և մեղր՝ ուղղակի արտադրողից։',
                    'en' => 'Traditional Armenian food products and honey directly from the producer.',
                ],
                'category'     => 'food',
                'template'     => 'elegant',
                'is_featured'  => true,
                'phone'        => '+37410560003',
                'email'        => 'order@ararat-foods.am',
                'address'      => 'Բաղրամյան 24, Երևան',
                'social_links' => ['instagram' => 'ararat_foods', 'facebook' => 'araratfoods'],
                'products'     => $this->foodProducts(),
            ],
            [
                'seller_name'  => 'Մարիամ Գրիգորյան',
                'seller_email' => 'mariam@sevan-beauty.am',
                'store_slug'   => 'sevan-beauty',
                'store_name'   => ['hy' => 'Սևան Բյուті', 'en' => 'Sevan Beauty'],
                'description'  => [
                    'hy' => 'Բնական հայկական բաղադրիչներով պատրաստված կոսմետիկ արտադրանք։',
                    'en' => 'Cosmetic products made with natural Armenian ingredients.',
                ],
                'category'     => 'beauty',
                'template'     => 'elegant',
                'is_featured'  => false,
                'phone'        => '+37410560004',
                'email'        => 'care@sevan-beauty.am',
                'address'      => 'Կոմիտաս 45, Երևան',
                'social_links' => ['instagram' => 'sevan_beauty'],
                'products'     => $this->beautyProducts(),
            ],
            [
                'seller_name'  => 'Արմեն Ավագյան',
                'seller_email' => 'armen@artisan-am.am',
                'store_slug'   => 'artisan-am',
                'store_name'   => ['hy' => 'Արտիզան Արմենիա', 'en' => 'Artisan Armenia'],
                'description'  => [
                    'hy' => 'Հայկական ձեռային արվեստ. կերամիկա, գործվածք, փայտ։ Ձեռքի աշխատանք յուրաքանչյուր ապրանք։',
                    'en' => 'Armenian handcraft: ceramics, textiles, wood. Every product handmade.',
                ],
                'category'     => 'other',
                'template'     => 'elegant',
                'is_featured'  => true,
                'phone'        => '+37410560005',
                'email'        => 'craft@artisan-am.am',
                'address'      => 'Շիրակի 17, Երևան',
                'social_links' => ['instagram' => 'artisan_armenia', 'facebook' => 'artisanarmenia'],
                'products'     => $this->artisanProducts(),
            ],
            [
                'seller_name'  => 'Տիգրան Մկրտչյան',
                'seller_email' => 'tigran@sportmax.am',
                'store_slug'   => 'sport-max-am',
                'store_name'   => ['hy' => 'Սպորտ Մաքս', 'en' => 'Sport Max Armenia'],
                'description'  => [
                    'hy' => 'Մարզական հանդերձ, սարքավորումներ և ակսեսուարներ բոլոր տարիքի համար։',
                    'en' => 'Sports clothing, equipment and accessories for all ages.',
                ],
                'category'     => 'sports',
                'template'     => 'bold',
                'is_featured'  => false,
                'phone'        => '+37410560006',
                'email'        => 'sport@sportmax.am',
                'address'      => 'Գայի 3, Երևան',
                'social_links' => ['instagram' => 'sportmax_am', 'facebook' => 'sportmaxarmenia'],
                'products'     => $this->sportsProducts(),
            ],
        ];
    }

    // ─── Product catalogues ────────────────────────────────────────────────────

    private function img(string $kw, int $a, int $b): array
    {
        $make = fn(int $lock) => [
            "https://loremflickr.com/800/600/{$kw}?lock={$lock}",
            "https://loremflickr.com/200/200/{$kw}?lock={$lock}",
            "https://loremflickr.com/400/400/{$kw}?lock={$lock}",
            "https://loremflickr.com/800/800/{$kw}?lock={$lock}",
        ];
        return [$make($a), $make($b)];
    }

        private function electronicsProducts(): array
    {
        return [
            [
                'name'        => ['hy' => 'Sony WH-1000XM5 Անլար ականջակալ', 'en' => 'Sony WH-1000XM5 Wireless Headphones'],
                'description' => ['hy' => 'Արդյունաբերական լավագույն աղմուկի ճնշումով անլար ականջակալ՝ 30 ժամ մարտկոցով։', 'en' => 'Industry-leading noise cancellation wireless headphones with 30-hour battery life.'],
                'price'       => 89900,
                'compare_price' => 109900,
                'stock'       => 12,
                'sku'         => 'SONY-WH1000XM5',
                'images'      => $this->img('headphones', 1, 2),
                'is_featured' => true,
                'variants'    => [
                    ['name' => ['hy' => 'Սև', 'en' => 'Black'], 'price' => 89900, 'stock' => 7, 'attributes' => ['color' => 'Black']],
                    ['name' => ['hy' => 'Արծաթ', 'en' => 'Silver'], 'price' => 89900, 'stock' => 5, 'attributes' => ['color' => 'Silver']],
                ],
            ],
            [
                'name'        => ['hy' => 'Apple AirPods Pro 2nd Gen', 'en' => 'Apple AirPods Pro 2nd Gen'],
                'description' => ['hy' => 'Ակտիվ աղմուկի ճնշում, Transparency Mode, Adaptive Audio։', 'en' => 'Active Noise Cancellation, Transparency Mode, Adaptive Audio.'],
                'price'       => 119900,
                'compare_price' => 139900,
                'stock'       => 20,
                'sku'         => 'APPLE-AIRPODSPRO2',
                'images'      => $this->img('earphones', 3, 4),
                'is_featured' => true,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Samsung 65" QLED 4K Smart TV', 'en' => 'Samsung 65" QLED 4K Smart TV'],
                'description' => ['hy' => 'Quantum Dot տեխնոլոգիա, HDR10+, 120Hz, Tizen OS, WiFi/Bluetooth։', 'en' => 'Quantum Dot technology, HDR10+, 120Hz panel, Tizen OS, WiFi/Bluetooth.'],
                'price'       => 649900,
                'compare_price' => null,
                'stock'       => 5,
                'sku'         => 'SAM-65QLED4K',
                'images'      => $this->img('television', 5, 6),
                'is_featured' => true,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Logitech MX Master 3S Մկնիկ', 'en' => 'Logitech MX Master 3S Mouse'],
                'description' => ['hy' => 'Անլար, 8000 DPI, MagSpeed անիվ, USB-C լիցք, Mac/PC։', 'en' => 'Wireless, 8000 DPI, MagSpeed scroll wheel, USB-C charging, works with Mac and PC.'],
                'price'       => 34900,
                'compare_price' => 39900,
                'stock'       => 30,
                'sku'         => 'LOGI-MXM3S',
                'images'      => $this->img('computer,mouse', 7, 8),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'Գրաֆիտ', 'en' => 'Graphite'], 'price' => 34900, 'stock' => 18, 'attributes' => ['color' => 'Graphite']],
                    ['name' => ['hy' => 'Գունատ Մոխրագույն', 'en' => 'Pale Grey'], 'price' => 34900, 'stock' => 12, 'attributes' => ['color' => 'Pale Grey']],
                ],
            ],
            [
                'name'        => ['hy' => 'Anker 65W GaN USB-C Լիցքավորիչ', 'en' => 'Anker 65W GaN USB-C Charger'],
                'description' => ['hy' => '4 պորտ, GaN II տեխնոլոգիա, կոմպակտ, MacBook/iPad/iPhone/Android։', 'en' => '4 ports, GaN II technology, compact size, compatible with MacBook/iPad/iPhone/Android.'],
                'price'       => 18900,
                'compare_price' => 22900,
                'stock'       => 50,
                'sku'         => 'ANKER-65WGAN',
                'images'      => $this->img('usb,charger', 9, 10),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Apple iPad Air M2 11"', 'en' => 'Apple iPad Air M2 11"'],
                'description' => ['hy' => 'M2 չիփ, Liquid Retina, 128GB, WiFi, Apple Pencil Pro ադապտ.։', 'en' => 'M2 chip, Liquid Retina display, 128GB storage, WiFi, supports Apple Pencil Pro.'],
                'price'       => 279900,
                'compare_price' => null,
                'stock'       => 8,
                'sku'         => 'APPLE-IPADAIRM2',
                'images'      => $this->img('tablet,ipad', 11, 12),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'Կապույտ / 128GB', 'en' => 'Blue / 128GB'], 'price' => 279900, 'stock' => 3, 'attributes' => ['color' => 'Blue', 'storage' => '128GB']],
                    ['name' => ['hy' => 'Աստղային / 128GB', 'en' => 'Starlight / 128GB'], 'price' => 279900, 'stock' => 3, 'attributes' => ['color' => 'Starlight', 'storage' => '128GB']],
                    ['name' => ['hy' => 'Կապույտ / 256GB', 'en' => 'Blue / 256GB'], 'price' => 329900, 'stock' => 2, 'attributes' => ['color' => 'Blue', 'storage' => '256GB']],
                ],
            ],
            [
                'name'        => ['hy' => 'WD Elements 2TB Արտաքին HDD', 'en' => 'WD Elements 2TB External HDD'],
                'description' => ['hy' => '2TB, USB 3.0, կոդավորում, Mac/PC, բջջային ձևավորում։', 'en' => '2TB capacity, USB 3.0, password protection, plug-and-play for Mac and PC.'],
                'price'       => 24900,
                'compare_price' => 29900,
                'stock'       => 25,
                'sku'         => 'WD-EL2TB',
                'images'      => $this->img('hard,drive', 13, 14),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Xiaomi Redmi Note 13 Pro 5G', 'en' => 'Xiaomi Redmi Note 13 Pro 5G'],
                'description' => ['hy' => '200MP camera, 5000mAh, 67W fast charge, 6.67" AMOLED 120Hz։', 'en' => '200MP triple camera, 5000mAh battery, 67W fast charging, 6.67" AMOLED 120Hz.'],
                'price'       => 159900,
                'compare_price' => 179900,
                'stock'       => 15,
                'sku'         => 'XIAO-RN13PRO5G',
                'images'      => $this->img('smartphone', 15, 16),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'Սև / 256GB', 'en' => 'Black / 256GB'], 'price' => 159900, 'stock' => 8, 'attributes' => ['color' => 'Black', 'storage' => '256GB']],
                    ['name' => ['hy' => 'Կանաչ / 256GB', 'en' => 'Forest Green / 256GB'], 'price' => 159900, 'stock' => 7, 'attributes' => ['color' => 'Forest Green', 'storage' => '256GB']],
                ],
            ],
            [
                'name'        => ['hy' => 'TP-Link Deco XE75 WiFi 6E', 'en' => 'TP-Link Deco XE75 WiFi 6E Mesh'],
                'description' => ['hy' => 'Tri-band WiFi 6E, 5400Mbps, mesh 3-pack, AI-driven mesh, EasyMesh։', 'en' => 'Tri-band WiFi 6E, 5400Mbps combined speed, 3-pack mesh, covers 6,500 sq ft.'],
                'price'       => 89900,
                'compare_price' => null,
                'stock'       => 10,
                'sku'         => 'TPL-DECOXE75',
                'images'      => $this->img('wifi,router', 17, 18),
                'is_featured' => false,
                'variants'    => [],
            ],
        ];
    }

    private function fashionProducts(): array
    {
        return [
            [
                'name'        => ['hy' => 'Հայկական Ճերմակ Բամbakya Վերնաշապիկ', 'en' => 'Armenian White Cotton Shirt'],
                'description' => ['hy' => '100% օրգանիկ բամbak, ձեռքով կարված, Հայաստանում արտ.', 'en' => '100% organic cotton, hand-stitched, made in Armenia. Traditional Armenian embroidery accents.'],
                'price'       => 12900,
                'compare_price' => 15900,
                'stock'       => 40,
                'sku'         => 'AF-SHIRT-WHT',
                'images'      => $this->img('white,shirt', 19, 20),
                'is_featured' => true,
                'variants'    => [
                    ['name' => ['hy' => 'S', 'en' => 'S'], 'price' => 12900, 'stock' => 10, 'attributes' => ['size' => 'S']],
                    ['name' => ['hy' => 'M', 'en' => 'M'], 'price' => 12900, 'stock' => 15, 'attributes' => ['size' => 'M']],
                    ['name' => ['hy' => 'L', 'en' => 'L'], 'price' => 12900, 'stock' => 10, 'attributes' => ['size' => 'L']],
                    ['name' => ['hy' => 'XL', 'en' => 'XL'], 'price' => 12900, 'stock' => 5, 'attributes' => ['size' => 'XL']],
                ],
            ],
            [
                'name'        => ['hy' => 'Զուգձիgoc Slim Fit Մուq', 'en' => 'Slim Fit Dark Jeans'],
                'description' => ['hy' => 'Բարձրորակ ձegram, eestretch գործvatz, մուq կապույt:, slim fit։', 'en' => 'High-quality stretch denim, slim fit, dark wash. Comfortable for everyday wear.'],
                'price'       => 18900,
                'compare_price' => 24900,
                'stock'       => 30,
                'sku'         => 'AF-JEAN-SLM',
                'images'      => $this->img('denim,jeans', 21, 22),
                'is_featured' => true,
                'variants'    => [
                    ['name' => ['hy' => '28', 'en' => 'W28'], 'price' => 18900, 'stock' => 5, 'attributes' => ['waist' => '28']],
                    ['name' => ['hy' => '30', 'en' => 'W30'], 'price' => 18900, 'stock' => 10, 'attributes' => ['waist' => '30']],
                    ['name' => ['hy' => '32', 'en' => 'W32'], 'price' => 18900, 'stock' => 10, 'attributes' => ['waist' => '32']],
                    ['name' => ['hy' => '34', 'en' => 'W34'], 'price' => 18900, 'stock' => 5, 'attributes' => ['waist' => '34']],
                ],
            ],
            [
                'name'        => ['hy' => 'Կաghi Բաճkoni Casual', 'en' => 'Casual Leather Jacket'],
                'description' => ['hy' => 'Արhiyun կաghi, unlined, slimfit, season transition jacket::', 'en' => 'Genuine leather, slim fit, perfect for spring and autumn. Minimalist design.'],
                'price'       => 69900,
                'compare_price' => 89900,
                'stock'       => 15,
                'sku'         => 'AF-LJKT-CAS',
                'images'      => $this->img('leather,jacket', 23, 24),
                'is_featured' => true,
                'variants'    => [
                    ['name' => ['hy' => 'S / Սev', 'en' => 'S / Black'], 'price' => 69900, 'stock' => 3, 'attributes' => ['size' => 'S', 'color' => 'Black']],
                    ['name' => ['hy' => 'M / Sev', 'en' => 'M / Black'], 'price' => 69900, 'stock' => 5, 'attributes' => ['size' => 'M', 'color' => 'Black']],
                    ['name' => ['hy' => 'L / Sev', 'en' => 'L / Black'], 'price' => 69900, 'stock' => 4, 'attributes' => ['size' => 'L', 'color' => 'Black']],
                    ['name' => ['hy' => 'M / Kaghni', 'en' => 'M / Brown'], 'price' => 69900, 'stock' => 3, 'attributes' => ['size' => 'M', 'color' => 'Brown']],
                ],
            ],
            [
                'name'        => ['hy' => 'Ամarannyal Midi Kisa', 'en' => 'Summer Floral Midi Dress'],
                'description' => ['hy' => 'Թegher floral print, midi uzundyun, 100% viscose, summer.::', 'en' => 'Floral print, midi length, 100% viscose fabric, breathable and elegant.'],
                'price'       => 22900,
                'compare_price' => null,
                'stock'       => 25,
                'sku'         => 'AF-DRSS-FLR',
                'images'      => $this->img('floral,dress', 25, 26),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'XS', 'en' => 'XS'], 'price' => 22900, 'stock' => 5, 'attributes' => ['size' => 'XS']],
                    ['name' => ['hy' => 'S', 'en' => 'S'], 'price' => 22900, 'stock' => 8, 'attributes' => ['size' => 'S']],
                    ['name' => ['hy' => 'M', 'en' => 'M'], 'price' => 22900, 'stock' => 8, 'attributes' => ['size' => 'M']],
                    ['name' => ['hy' => 'L', 'en' => 'L'], 'price' => 22900, 'stock' => 4, 'attributes' => ['size' => 'L']],
                ],
            ],
            [
                'name'        => ['hy' => 'Kirak Brd Cashmere Sweater', 'en' => 'Lightweight Cashmere Sweater'],
                'description' => ['hy' => '70% cashmere, 30% silk, v-neck, winter warm, dry clean only.', 'en' => '70% cashmere 30% silk blend, v-neck, lightweight yet warm, dry clean.'],
                'price'       => 49900,
                'compare_price' => 62900,
                'stock'       => 20,
                'sku'         => 'AF-SWTR-CSH',
                'images'      => $this->img('cashmere,sweater', 27, 28),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'S / Khaki', 'en' => 'S / Khaki'], 'price' => 49900, 'stock' => 5, 'attributes' => ['size' => 'S', 'color' => 'Khaki']],
                    ['name' => ['hy' => 'M / Khaki', 'en' => 'M / Khaki'], 'price' => 49900, 'stock' => 7, 'attributes' => ['size' => 'M', 'color' => 'Khaki']],
                    ['name' => ['hy' => 'L / Khaki', 'en' => 'L / Khaki'], 'price' => 49900, 'stock' => 5, 'attributes' => ['size' => 'L', 'color' => 'Khaki']],
                    ['name' => ['hy' => 'M / Navy', 'en' => 'M / Navy'], 'price' => 49900, 'stock' => 3, 'attributes' => ['size' => 'M', 'color' => 'Navy']],
                ],
            ],
            [
                'name'        => ['hy' => 'Արhayan Ornament Print T-shirt', 'en' => 'Armenian Ornament Print T-Shirt'],
                'description' => ['hy' => 'Հայկական ավandk nshanner, 100% cotton, unisex, screen-printed.', 'en' => 'Traditional Armenian ornament print, 100% cotton, unisex fit, screen-printed.'],
                'price'       => 8900,
                'compare_price' => null,
                'stock'       => 60,
                'sku'         => 'AF-TSHRT-ORM',
                'images'      => $this->img('tshirt', 29, 30),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'S / Sev', 'en' => 'S / Black'], 'price' => 8900, 'stock' => 15, 'attributes' => ['size' => 'S', 'color' => 'Black']],
                    ['name' => ['hy' => 'M / Sev', 'en' => 'M / Black'], 'price' => 8900, 'stock' => 20, 'attributes' => ['size' => 'M', 'color' => 'Black']],
                    ['name' => ['hy' => 'L / Sev', 'en' => 'L / Black'], 'price' => 8900, 'stock' => 15, 'attributes' => ['size' => 'L', 'color' => 'Black']],
                    ['name' => ['hy' => 'M / Chakagjnayin', 'en' => 'M / White'], 'price' => 8900, 'stock' => 10, 'attributes' => ['size' => 'M', 'color' => 'White']],
                ],
            ],
            [
                'name'        => ['hy' => 'Silk Evening Bag Clutch', 'en' => 'Silk Evening Clutch Bag'],
                'description' => ['hy' => 'Բnakan metakse, gold clasp, bj handmade Armenia.', 'en' => 'Natural silk, gold-tone clasp, handmade in Armenia. Perfect for evening events.'],
                'price'       => 32900,
                'compare_price' => 39900,
                'stock'       => 18,
                'sku'         => 'AF-BAG-EVECLCH',
                'images'      => $this->img('clutch,bag', 31, 32),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'Ոskeguy', 'en' => 'Gold'], 'price' => 32900, 'stock' => 9, 'attributes' => ['color' => 'Gold']],
                    ['name' => ['hy' => 'Artsataguyn', 'en' => 'Silver'], 'price' => 32900, 'stock' => 9, 'attributes' => ['color' => 'Silver']],
                ],
            ],
            [
                'name'        => ['hy' => 'Jogging Set Slim fit 2-piece', 'en' => 'Jogging Set 2-Piece Slim Fit'],
                'description' => ['hy' => 'Jogger + hoodie set, 80% cotton 20% polyester, athletic look.', 'en' => 'Matching jogger pants + hoodie, 80% cotton 20% polyester, athletic slim cut.'],
                'price'       => 29900,
                'compare_price' => 36900,
                'stock'       => 35,
                'sku'         => 'AF-JOG-SET2P',
                'images'      => $this->img('tracksuit', 33, 34),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'S / Kheghj', 'en' => 'S / Grey'], 'price' => 29900, 'stock' => 8, 'attributes' => ['size' => 'S', 'color' => 'Grey']],
                    ['name' => ['hy' => 'M / Kheghj', 'en' => 'M / Grey'], 'price' => 29900, 'stock' => 12, 'attributes' => ['size' => 'M', 'color' => 'Grey']],
                    ['name' => ['hy' => 'L / Kheghj', 'en' => 'L / Grey'], 'price' => 29900, 'stock' => 10, 'attributes' => ['size' => 'L', 'color' => 'Grey']],
                    ['name' => ['hy' => 'M / Sev', 'en' => 'M / Black'], 'price' => 29900, 'stock' => 5, 'attributes' => ['size' => 'M', 'color' => 'Black']],
                ],
            ],
        ];
    }

    private function foodProducts(): array
    {
        return [
            [
                'name'        => ['hy' => 'Հայկական Wildflower Մեղր 1կg', 'en' => 'Armenian Wildflower Honey 1kg'],
                'description' => ['hy' => 'Հավakvats Լوrnavan-i dzarravorner-ic. 100% bnakan, amen mijocararan hamadzayn.', 'en' => 'Harvested from Lori province wildflowers. 100% raw, unfiltered, naturally crystallizing.'],
                'price'       => 4900,
                'compare_price' => null,
                'stock'       => 80,
                'sku'         => 'AF-HONEY-1KG',
                'images'      => $this->img('honey,jar', 35, 36),
                'is_featured' => true,
                'variants'    => [
                    ['name' => ['hy' => '500g', 'en' => '500g'], 'price' => 2700, 'stock' => 40, 'attributes' => ['weight' => '500g']],
                    ['name' => ['hy' => '1kg', 'en' => '1kg'], 'price' => 4900, 'stock' => 30, 'attributes' => ['weight' => '1kg']],
                    ['name' => ['hy' => '2kg', 'en' => '2kg'], 'price' => 8900, 'stock' => 10, 'attributes' => ['weight' => '2kg']],
                ],
            ],
            [
                'name'        => ['hy' => 'Սev Kavij Arabica Single Origin', 'en' => 'Dark Roast Arabica Single Origin Coffee'],
                'description' => ['hy' => 'Hamaynaian Arabica, medium grind, artisan roasted Yerevan.', 'en' => 'Ethiopian Arabica single origin, medium grind, artisan roasted in Yerevan. Notes of berry and chocolate.'],
                'price'       => 3900,
                'compare_price' => null,
                'stock'       => 100,
                'sku'         => 'AF-COFFEE-ARB',
                'images'      => $this->img('coffee,beans', 37, 38),
                'is_featured' => true,
                'variants'    => [
                    ['name' => ['hy' => '250g', 'en' => '250g'], 'price' => 2200, 'stock' => 50, 'attributes' => ['weight' => '250g']],
                    ['name' => ['hy' => '500g', 'en' => '500g'], 'price' => 3900, 'stock' => 40, 'attributes' => ['weight' => '500g']],
                    ['name' => ['hy' => '1kg', 'en' => '1kg'], 'price' => 7200, 'stock' => 10, 'attributes' => ['weight' => '1kg']],
                ],
            ],
            [
                'name'        => ['hy' => 'Ararat Premium Konyak 10* 500ml', 'en' => 'Ararat Premium Brandy 10* 500ml'],
                'description' => ['hy' => '10 tari haskacac, golden amber, vanilla-oak notes, gift boxed.', 'en' => '10-year aged Armenian brandy, golden amber color, vanilla and oak notes. Comes in gift box.'],
                'price'       => 19900,
                'compare_price' => null,
                'stock'       => 40,
                'sku'         => 'AF-ARARAT10-500',
                'images'      => $this->img('brandy,bottle', 39, 40),
                'is_featured' => true,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Bnakan Moro Jam Set (3-pack)', 'en' => 'Natural Berry Jam Set (3-pack)'],
                'description' => ['hy' => 'Visnab, Bnakan Aluch, Shmlore, handmade from Armenian orchards, no preservatives.', 'en' => 'Cherry, apricot, and mulberry jams. Handmade from Armenian orchards, no preservatives, 200g each.'],
                'price'       => 4500,
                'compare_price' => 5400,
                'stock'       => 60,
                'sku'         => 'AF-JAM-SET3',
                'images'      => $this->img('fruit,jam', 41, 42),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Surb Aghbyur Spring Water 1.5L (x6)', 'en' => 'Surb Aghbyur Spring Water 1.5L (6-pack)'],
                'description' => ['hy' => 'Tsaghkadzori aghbyuri jur, ec mineralacvac, 6-ak paket.', 'en' => 'Natural spring water from Tsakhkadzor source, low mineral content, pack of 6.'],
                'price'       => 1800,
                'compare_price' => null,
                'stock'       => 200,
                'sku'         => 'AF-WATER-6PK',
                'images'      => $this->img('mineral,water', 43, 44),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Bnakan Zeytichan Dzet 500ml', 'en' => 'Armenian Extra Virgin Olive Oil 500ml'],
                'description' => ['hy' => 'Cold-pressed, first extraction, Armenian producer, glass bottle, rich flavor.', 'en' => 'Cold-pressed extra virgin, first extraction, Armenian producer, 500ml glass bottle.'],
                'price'       => 6900,
                'compare_price' => 8500,
                'stock'       => 45,
                'sku'         => 'AF-OLIVE-500',
                'images'      => $this->img('olive,oil', 45, 46),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Tartsrac Mish Hamadzaynoryan (400g)', 'en' => 'Dry Mixed Nuts Premium (400g)'],
                'description' => ['hy' => 'Akhur, naush, manr hatsik, dziran, without salt, premium quality.', 'en' => 'Walnuts, almonds, cashews, dried apricots, unsalted, premium quality from Armenian highlands.'],
                'price'       => 5900,
                'compare_price' => null,
                'stock'       => 70,
                'sku'         => 'AF-NUTS-400G',
                'images'      => $this->img('mixed,nuts', 47, 48),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => '200g', 'en' => '200g'], 'price' => 3200, 'stock' => 35, 'attributes' => ['weight' => '200g']],
                    ['name' => ['hy' => '400g', 'en' => '400g'], 'price' => 5900, 'stock' => 25, 'attributes' => ['weight' => '400g']],
                    ['name' => ['hy' => '800g', 'en' => '800g'], 'price' => 10900, 'stock' => 10, 'attributes' => ['weight' => '800g']],
                ],
            ],
            [
                'name'        => ['hy' => 'Homemade Basturma 200g', 'en' => 'Homemade Armenian Basturma 200g'],
                'description' => ['hy' => 'Avandakan hayakakan basturma, 45 or haskacac, fenugreek blend, vacuum packed.', 'en' => 'Traditional Armenian cured beef, 45-day cured with authentic fenugreek spice blend, vacuum packed.'],
                'price'       => 8900,
                'compare_price' => null,
                'stock'       => 30,
                'sku'         => 'AF-BSTURMA-200',
                'images'      => $this->img('charcuterie', 49, 50),
                'is_featured' => false,
                'variants'    => [],
            ],
        ];
    }

    private function beautyProducts(): array
    {
        return [
            [
                'name'        => ['hy' => 'Vard Vardaguyn Face Cream 50ml', 'en' => 'Rose Extract Moisturizing Face Cream 50ml'],
                'description' => ['hy' => 'Hayastani varun extract, SPF 15, all skin types, hypoallergenic, not tested on animals.', 'en' => 'Armenian rose extract, SPF 15, suitable for all skin types, hypoallergenic, cruelty-free.'],
                'price'       => 12900,
                'compare_price' => 15900,
                'stock'       => 50,
                'sku'         => 'SB-FCREAM-ROSE',
                'images'      => $this->img('face,cream', 51, 52),
                'is_featured' => true,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Bnakan Lavender Body Lotion 200ml', 'en' => 'Natural Lavender Body Lotion 200ml'],
                'description' => ['hy' => 'Lavender oil + shea butter + vitamin E, Sevan ezrı flora, no parabens.', 'en' => 'Lavender essential oil, shea butter, and vitamin E. Inspired by Lake Sevan flora, paraben-free.'],
                'price'       => 7900,
                'compare_price' => null,
                'stock'       => 60,
                'sku'         => 'SB-BLOTION-LAV',
                'images'      => $this->img('body,lotion', 53, 54),
                'is_featured' => true,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Argane Shampoo + Conditioner Set', 'en' => 'Argan Oil Shampoo & Conditioner Set'],
                'description' => ['hy' => 'Sulfate-free, argan oil + keratin, color-safe, for all hair types, 250ml each.', 'en' => 'Sulfate-free, argan oil and keratin formula, color-safe, for all hair types, 250ml each.'],
                'price'       => 11900,
                'compare_price' => 14900,
                'stock'       => 45,
                'sku'         => 'SB-HAIR-ARGSET',
                'images'      => $this->img('shampoo,bottle', 55, 56),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Charcoal Deep Cleansing Mask 100ml', 'en' => 'Activated Charcoal Deep Cleansing Mask 100ml'],
                'description' => ['hy' => 'Activated charcoal + kaolin clay + tea tree oil, pore minimizing, 2-3x/week use.', 'en' => 'Activated charcoal, kaolin clay, tea tree oil. Deep pore cleansing, use 2-3 times per week.'],
                'price'       => 8900,
                'compare_price' => 10900,
                'stock'       => 55,
                'sku'         => 'SB-MASK-CHAR',
                'images'      => $this->img('face,mask', 57, 58),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'SPF 50 Mineral Sunscreen 80ml', 'en' => 'SPF 50+ Mineral Sunscreen 80ml'],
                'description' => ['hy' => 'Zinc oxide 20%, tinted, water-resistant 80min, no white cast, reef-safe.', 'en' => 'Zinc oxide 20%, lightly tinted, water-resistant 80 minutes, no white cast, reef-safe formula.'],
                'price'       => 9900,
                'compare_price' => null,
                'stock'       => 40,
                'sku'         => 'SB-SUN-SPF50',
                'images'      => $this->img('sunscreen', 59, 60),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Lip Care Set Beeswax 3-pack', 'en' => 'Beeswax Lip Care Set 3-Pack'],
                'description' => ['hy' => 'Armenian beeswax + honey + vitamin E, 3 flavors: original, cherry, vanilla.', 'en' => 'Armenian beeswax, honey, and vitamin E. Set of 3: original, cherry, and vanilla flavors.'],
                'price'       => 4500,
                'compare_price' => null,
                'stock'       => 80,
                'sku'         => 'SB-LIP-SET3',
                'images'      => $this->img('lipbalm', 61, 62),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Hnaguyni Serum Hyaluronic Acid 30ml', 'en' => 'Anti-Aging Hyaluronic Acid Serum 30ml'],
                'description' => ['hy' => '2% hyaluronic acid, B5 vitamin, retinol, reduce fine lines, all skin types.', 'en' => '2% hyaluronic acid with B5 vitamin and retinol complex. Reduces fine lines, all skin types.'],
                'price'       => 16900,
                'compare_price' => 21900,
                'stock'       => 35,
                'sku'         => 'SB-SRM-HYAL',
                'images'      => $this->img('skincare,serum', 63, 64),
                'is_featured' => false,
                'variants'    => [],
            ],
        ];
    }

    private function artisanProducts(): array
    {
        return [
            [
                'name'        => ['hy' => 'Ձeragorts Keramikakan Ambaner (4-pack)', 'en' => 'Handmade Ceramic Bowl Set (4-pack)'],
                'description' => ['hy' => 'Kavotan karakam ceramics, each unique, lead-free glaze, dishwasher safe, Armenian motifs.', 'en' => 'Handcrafted ceramic bowls, each unique, lead-free glaze, dishwasher safe, Armenian motifs.'],
                'price'       => 24900,
                'compare_price' => null,
                'stock'       => 20,
                'sku'         => 'AA-BOWL-SET4',
                'images'      => $this->img('ceramic,bowl', 65, 66),
                'is_featured' => true,
                'variants'    => [
                    ['name' => ['hy' => 'Kargnil / 4-pack', 'en' => 'Blue / 4-pack'], 'price' => 24900, 'stock' => 10, 'attributes' => ['color' => 'Blue']],
                    ['name' => ['hy' => 'Aghyus / 4-pack', 'en' => 'Terracotta / 4-pack'], 'price' => 24900, 'stock' => 10, 'attributes' => ['color' => 'Terracotta']],
                ],
            ],
            [
                'name'        => ['hy' => 'Dzaragorts Metsatsar Gorg 60x90cm', 'en' => 'Hand-woven Wool Rug 60x90cm'],
                'description' => ['hy' => 'Traditional Armenian pattern, natural wool dye, hand-woven in Gyumri. Each piece unique.', 'en' => 'Traditional Armenian geometric pattern, naturally dyed wool, hand-woven in Gyumri. Each piece unique.'],
                'price'       => 89900,
                'compare_price' => null,
                'stock'       => 8,
                'sku'         => 'AA-RUG-6090',
                'images'      => $this->img('woven,rug', 67, 68),
                'is_featured' => true,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Kashi Dekorative Panel Khachkar', 'en' => 'Decorative Stone Khachkar Panel'],
                'description' => ['hy' => 'Carved tuff stone, traditional Armenian cross-stone design, wall mount, 30x40cm.', 'en' => 'Hand-carved Armenian tuff stone, traditional khachkar design, wall mount, 30x40cm.'],
                'price'       => 34900,
                'compare_price' => 42900,
                'stock'       => 12,
                'sku'         => 'AA-KHACH-3040',
                'images'      => $this->img('stone,carving', 69, 70),
                'is_featured' => true,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Dzaragorts Kaghni Chutak Small', 'en' => 'Handcrafted Leather Journal Small'],
                'description' => ['hy' => 'Full-grain leather cover, hand-stitched, refillable, A6 size, Armenian embossed pattern.', 'en' => 'Full-grain leather cover, hand-stitched, refillable pages, A6 size. Armenian embossed motif.'],
                'price'       => 12900,
                'compare_price' => null,
                'stock'       => 30,
                'sku'         => 'AA-JRNL-SML',
                'images'      => $this->img('leather,journal', 71, 72),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'Kzagni', 'en' => 'Brown'], 'price' => 12900, 'stock' => 15, 'attributes' => ['color' => 'Brown']],
                    ['name' => ['hy' => 'Sev', 'en' => 'Black'], 'price' => 12900, 'stock' => 15, 'attributes' => ['color' => 'Black']],
                ],
            ],
            [
                'name'        => ['hy' => 'Meghramomit Momaketir Set Gift Box', 'en' => 'Beeswax Candle Gift Box Set'],
                'description' => ['hy' => 'Armenian beeswax, 6 candles, lavender/rose/cedar scents, burn 40+ hrs each, gift packaged.', 'en' => 'Pure Armenian beeswax candles, set of 6. Lavender, rose, and cedarwood scents. Burns 40+ hours each.'],
                'price'       => 18900,
                'compare_price' => 22900,
                'stock'       => 25,
                'sku'         => 'AA-CNDL-GFTSET',
                'images'      => $this->img('beeswax,candle', 73, 74),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Dzaragorts Keramika Katch Kashe', 'en' => 'Handmade Ceramic Coffee Mug'],
                'description' => ['hy' => 'Wheel-thrown ceramic, 350ml, dishwasher safe, each has unique glaze pattern.', 'en' => 'Wheel-thrown ceramic mug, 350ml capacity, dishwasher safe, each piece has unique glaze pattern.'],
                'price'       => 8900,
                'compare_price' => null,
                'stock'       => 40,
                'sku'         => 'AA-MUG-CERM',
                'images'      => $this->img('ceramic,mug', 75, 76),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'Kargnil', 'en' => 'Blue'], 'price' => 8900, 'stock' => 15, 'attributes' => ['color' => 'Blue']],
                    ['name' => ['hy' => 'Kanach', 'en' => 'Green'], 'price' => 8900, 'stock' => 15, 'attributes' => ['color' => 'Green']],
                    ['name' => ['hy' => 'Aghyus', 'en' => 'Terracotta'], 'price' => 8900, 'stock' => 10, 'attributes' => ['color' => 'Terracotta']],
                ],
            ],
            [
                'name'        => ['hy' => 'Macramé Ceiling Adzavara', 'en' => 'Macramé Wall Hanging Decoration'],
                'description' => ['hy' => 'Handmade macramé, natural cotton rope, 60cm wide, boho style, ready to hang.', 'en' => 'Handmade macramé wall hanging, natural cotton rope, 60cm wide, boho-style, ready to hang.'],
                'price'       => 15900,
                'compare_price' => null,
                'stock'       => 15,
                'sku'         => 'AA-MACR-WALL',
                'images'      => $this->img('macrame', 77, 78),
                'is_featured' => false,
                'variants'    => [],
            ],
        ];
    }

    private function sportsProducts(): array
    {
        return [
            [
                'name'        => ['hy' => 'Nike Dri-FIT Running T-shirt', 'en' => 'Nike Dri-FIT Running T-Shirt'],
                'description' => ['hy' => 'Lightweight Dri-FIT fabric, sweat-wicking, reflective logo, lightweight seams.', 'en' => 'Nike Dri-FIT moisture-wicking fabric, lightweight flatlock seams, reflective logo. For running.'],
                'price'       => 14900,
                'compare_price' => 18900,
                'stock'       => 60,
                'sku'         => 'SM-NIKE-DFTEE',
                'images'      => $this->img('running,shirt', 79, 80),
                'is_featured' => true,
                'variants'    => [
                    ['name' => ['hy' => 'S / Sev', 'en' => 'S / Black'], 'price' => 14900, 'stock' => 12, 'attributes' => ['size' => 'S', 'color' => 'Black']],
                    ['name' => ['hy' => 'M / Sev', 'en' => 'M / Black'], 'price' => 14900, 'stock' => 18, 'attributes' => ['size' => 'M', 'color' => 'Black']],
                    ['name' => ['hy' => 'L / Sev', 'en' => 'L / Black'], 'price' => 14900, 'stock' => 15, 'attributes' => ['size' => 'L', 'color' => 'Black']],
                    ['name' => ['hy' => 'M / Ardzagavayn', 'en' => 'M / Royal Blue'], 'price' => 14900, 'stock' => 15, 'attributes' => ['size' => 'M', 'color' => 'Royal Blue']],
                ],
            ],
            [
                'name'        => ['hy' => 'Adidas Ultraboost 22 Running Shoes', 'en' => 'Adidas Ultraboost 22 Running Shoes'],
                'description' => ['hy' => 'BOOST midsole, Primeknit upper, Continental rubber outsole, responsive cushioning.', 'en' => 'BOOST midsole for energy return, Primeknit upper, Continental rubber outsole, responsive cushioning.'],
                'price'       => 89900,
                'compare_price' => 109900,
                'stock'       => 20,
                'sku'         => 'SM-ADID-UB22',
                'images'      => $this->img('running,shoes', 81, 82),
                'is_featured' => true,
                'variants'    => [
                    ['name' => ['hy' => '41', 'en' => 'EU 41'], 'price' => 89900, 'stock' => 4, 'attributes' => ['size' => 'EU 41']],
                    ['name' => ['hy' => '42', 'en' => 'EU 42'], 'price' => 89900, 'stock' => 6, 'attributes' => ['size' => 'EU 42']],
                    ['name' => ['hy' => '43', 'en' => 'EU 43'], 'price' => 89900, 'stock' => 6, 'attributes' => ['size' => 'EU 43']],
                    ['name' => ['hy' => '44', 'en' => 'EU 44'], 'price' => 89900, 'stock' => 4, 'attributes' => ['size' => 'EU 44']],
                ],
            ],
            [
                'name'        => ['hy' => 'Resistance Bands Set 5-level', 'en' => 'Resistance Bands Set 5-Level'],
                'description' => ['hy' => '5 bands, 10-50 lb resistance, non-slip handles, door anchor, carry bag.', 'en' => '5 resistance levels 10-50 lbs, non-slip handles, door anchor, ankle straps, and carry bag included.'],
                'price'       => 12900,
                'compare_price' => 15900,
                'stock'       => 50,
                'sku'         => 'SM-RESBND-SET5',
                'images'      => $this->img('resistance,band', 83, 84),
                'is_featured' => true,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Yoga Mat Premium 6mm TPE', 'en' => 'Premium TPE Yoga Mat 6mm'],
                'description' => ['hy' => 'Eco-friendly TPE, 6mm thick, non-slip surface, carrying strap, 183x61cm.', 'en' => 'Eco-friendly TPE material, 6mm cushioning, non-slip both sides, carrying strap, 183x61cm.'],
                'price'       => 16900,
                'compare_price' => null,
                'stock'       => 35,
                'sku'         => 'SM-YOGA-6MM',
                'images'      => $this->img('yoga,mat', 85, 86),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'Moryakaguyn', 'en' => 'Navy Blue'], 'price' => 16900, 'stock' => 15, 'attributes' => ['color' => 'Navy Blue']],
                    ['name' => ['hy' => 'Moraguyn', 'en' => 'Purple'], 'price' => 16900, 'stock' => 12, 'attributes' => ['color' => 'Purple']],
                    ['name' => ['hy' => 'Kanach', 'en' => 'Green'], 'price' => 16900, 'stock' => 8, 'attributes' => ['color' => 'Green']],
                ],
            ],
            [
                'name'        => ['hy' => 'Adjustable Dumbbell Set 2-24kg', 'en' => 'Adjustable Dumbbell Set 2-24kg'],
                'description' => ['hy' => 'Single dumbbell replaces 15 weights, quick-adjust dial, chrome steel, 2-24kg.', 'en' => 'Single dumbbell replaces 15 weights (2-24kg), quick-adjust selector dial, durable chrome steel.'],
                'price'       => 129900,
                'compare_price' => 149900,
                'stock'       => 10,
                'sku'         => 'SM-DUMBL-ADJ24',
                'images'      => $this->img('dumbbell', 87, 88),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Protein Shake Shaker 700ml', 'en' => 'Protein Shaker Bottle 700ml'],
                'description' => ['hy' => 'BPA-free, leak-proof, wire whisk ball, measurements, 700ml, 3 colors.', 'en' => 'BPA-free plastic, leak-proof lid, metal wire whisk ball, measurement markings, 700ml.'],
                'price'       => 3900,
                'compare_price' => null,
                'stock'       => 80,
                'sku'         => 'SM-SHKR-700',
                'images'      => $this->img('protein,shaker', 89, 90),
                'is_featured' => false,
                'variants'    => [
                    ['name' => ['hy' => 'Sev', 'en' => 'Black'], 'price' => 3900, 'stock' => 30, 'attributes' => ['color' => 'Black']],
                    ['name' => ['hy' => 'Chakagjnayin', 'en' => 'White'], 'price' => 3900, 'stock' => 30, 'attributes' => ['color' => 'White']],
                    ['name' => ['hy' => 'Kargnil', 'en' => 'Blue'], 'price' => 3900, 'stock' => 20, 'attributes' => ['color' => 'Blue']],
                ],
            ],
            [
                'name'        => ['hy' => 'Pull-Up Bar Doorway no-screw', 'en' => 'Doorway Pull-Up Bar (No Screw)'],
                'description' => ['hy' => 'No-drill mount, 70-110cm adjustable, max 150kg, foam grips, chin-up + pull-up.', 'en' => 'No-drill door mount, adjustable 70-110cm, max 150kg load, foam grips, for chin-ups and pull-ups.'],
                'price'       => 14900,
                'compare_price' => 17900,
                'stock'       => 30,
                'sku'         => 'SM-PULLUP-DOOR',
                'images'      => $this->img('pullup', 91, 92),
                'is_featured' => false,
                'variants'    => [],
            ],
            [
                'name'        => ['hy' => 'Jump Rope Speed Cable', 'en' => 'Speed Cable Jump Rope'],
                'description' => ['hy' => 'Ball bearing handles, 3mm steel cable, adjustable length, 5mm thick cable, boxing/fitness.', 'en' => 'Ball-bearing handles, 3mm steel cable with PVC coat, adjustable length up to 3m. For boxing and fitness.'],
                'price'       => 5900,
                'compare_price' => null,
                'stock'       => 60,
                'sku'         => 'SM-ROPE-SPD',
                'images'      => $this->img('jump,rope', 93, 94),
                'is_featured' => false,
                'variants'    => [],
            ],
        ];
    }

    // ─── Order history ─────────────────────────────────────────────────────────

    private array $orderScenarios = [
        ['status' => OrderStatus::Delivered, 'payment_status' => PaymentStatus::Paid,    'days_ago' => 45],
        ['status' => OrderStatus::Delivered, 'payment_status' => PaymentStatus::Paid,    'days_ago' => 38],
        ['status' => OrderStatus::Delivered, 'payment_status' => PaymentStatus::Paid,    'days_ago' => 32],
        ['status' => OrderStatus::Shipped,   'payment_status' => PaymentStatus::Paid,    'days_ago' => 10],
        ['status' => OrderStatus::Shipped,   'payment_status' => PaymentStatus::Paid,    'days_ago' => 8],
        ['status' => OrderStatus::Processing,'payment_status' => PaymentStatus::Paid,    'days_ago' => 4],
        ['status' => OrderStatus::Processing,'payment_status' => PaymentStatus::Paid,    'days_ago' => 3],
        ['status' => OrderStatus::Paid,      'payment_status' => PaymentStatus::Paid,    'days_ago' => 2],
        ['status' => OrderStatus::Pending,   'payment_status' => PaymentStatus::Pending, 'days_ago' => 1],
        ['status' => OrderStatus::Cancelled, 'payment_status' => PaymentStatus::Failed,  'days_ago' => 20],
    ];

    // ─── Main run ──────────────────────────────────────────────────────────────

    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            SuperAdminSeeder::class,
            PaymentGatewaySeeder::class,
            CategorySeeder::class,
            StoreTemplateSeeder::class,
            PagesSeeder::class,
        ]);

        $idram    = PaymentGateway::where('name', 'idram')->firstOrFail();
        $inecobank = PaymentGateway::where('name', 'inecobank')->first();

        foreach ($this->stores() as $storeDef) {
            $seller   = $this->createSeller($storeDef['seller_email'], $storeDef['seller_name']);
            $store    = $this->createStore($seller, $storeDef);
            $this->configurePayments($store, $idram, $inecobank);
            $category = Category::where('slug', $storeDef['category'])->first();
            $products = $this->createProducts($store, $storeDef['products'], $category);
            $this->createOrders($store, $products);
        }
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private function createSeller(string $email, string $name): User
    {
        $seller = User::firstOrCreate(
            ['email' => $email],
            [
                'name'              => $name,
                'password'          => Hash::make('Password1!'),
                'role'              => UserRole::Seller,
                'status'            => UserStatus::Active,
                'locale'            => 'hy',
                'email_verified_at' => now(),
            ]
        );

        if (!$seller->hasRole('seller')) {
            $seller->assignRole('seller');
        }

        return $seller;
    }

    private function createStore(User $seller, array $def): Store
    {
        return Store::firstOrCreate(
            ['slug' => $def['store_slug']],
            [
                'user_id'             => $seller->id,
                'name'                => $def['store_name'],
                'description'         => $def['description'],
                'status'              => StoreStatus::Active,
                'active_template_key' => $def['template'],
                'currency'            => 'AMD',
                'is_featured'         => $def['is_featured'],
                'phone'               => $def['phone'],
                'email'               => $def['email'],
                'address'             => $def['address'],
                'social_links'        => $def['social_links'],
            ]
        );
    }

    private function configurePayments(Store $store, PaymentGateway $idram, ?PaymentGateway $inecobank): void
    {
        StorePaymentGateway::firstOrCreate(
            ['store_id' => $store->id, 'payment_gateway_id' => $idram->id],
            [
                'is_enabled'  => true,
                'is_sandbox'  => true,
                'credentials' => ['account_id' => 'DEMO_' . strtoupper($store->slug), 'secret_key' => Str::random(32)],
            ]
        );

        if ($inecobank) {
            StorePaymentGateway::firstOrCreate(
                ['store_id' => $store->id, 'payment_gateway_id' => $inecobank->id],
                [
                    'is_enabled'  => false,
                    'is_sandbox'  => true,
                    'credentials' => ['merchant_id' => 'DEMO_' . strtoupper($store->slug), 'api_key' => Str::random(40)],
                ]
            );
        }
    }

    private function createProducts(Store $store, array $productDefs, ?Category $category): array
    {
        $products = [];

        foreach ($productDefs as $i => $def) {
            $slug = Str::slug($def['name']['en']) . '-' . Str::slug($store->slug);

            $product = Product::firstOrCreate(
                ['store_id' => $store->id, 'slug' => $slug],
                [
                    'category_id'       => $category?->id,
                    'name'              => $def['name'],
                    'description'       => $def['description'],
                    'slug'              => $slug,
                    'sku'               => $def['sku'],
                    'price'             => $def['price'],
                    'compare_price'     => $def['compare_price'] ?? null,
                    'stock'             => $def['stock'],
                    'manage_stock'      => true,
                    'status'            => ProductStatus::Active,
                    'is_featured'       => $def['is_featured'],
                    'sort_order'        => $i,
                ]
            );

            if (isset($def['images'])) {
                ProductImage::where('product_id', $product->id)->delete();
                foreach ($def['images'] as $j => [$orig, $thumb, $med, $lrg]) {
                    ProductImage::create([
                        'product_id'     => $product->id,
                        'path_original'  => $orig,
                        'path_thumbnail' => $thumb,
                        'path_medium'    => $med,
                        'path_large'     => $lrg,
                        'sort_order'     => $j,
                        'is_primary'     => $j === 0,
                    ]);
                }
            } elseif ($product->wasRecentlyCreated) {
                $seeds = ['a' . $i, 'b' . $i];
                foreach ($seeds as $j => $seed) {
                    ProductImage::create([
                        'product_id'     => $product->id,
                        'path_original'  => "https://picsum.photos/seed/{$store->slug}{$seed}/800/600",
                        'path_thumbnail' => "https://picsum.photos/seed/{$store->slug}{$seed}/200/200",
                        'path_medium'    => "https://picsum.photos/seed/{$store->slug}{$seed}/400/400",
                        'path_large'     => "https://picsum.photos/seed/{$store->slug}{$seed}/800/800",
                        'sort_order'     => $j,
                        'is_primary'     => $j === 0,
                    ]);
                }
            }

            if ($product->wasRecentlyCreated) {
                foreach ($def['variants'] as $v) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'name'       => $v['name'],
                        'sku'        => $def['sku'] . '-' . Str::slug($v['name']['en']),
                        'price'      => $v['price'],
                        'stock'      => $v['stock'],
                        'attributes' => $v['attributes'],
                        'is_active'  => true,
                    ]);
                }
            }

            $products[] = $product;
        }

        return $products;
    }

    private function createOrders(Store $store, array $products): void
    {
        foreach ($this->orderScenarios as $i => $scenario) {
            $customer = $this->customers[$i % count($this->customers)];
            $address  = $this->addresses[$i % count($this->addresses)];
            $product  = $products[$i % count($products)];
            $quantity = rand(1, 3);
            $subtotal = $product->price * $quantity;
            $shipping = $subtotal > 30000 ? 0 : 700;
            $total    = $subtotal + $shipping;
            $createdAt = now()->subDays($scenario['days_ago'])->subHours(rand(0, 12));

            $order = Order::create([
                'store_id'         => $store->id,
                'status'           => $scenario['status'],
                'payment_status'   => $scenario['payment_status'],
                'subtotal'         => $subtotal,
                'discount'         => 0,
                'shipping_cost'    => $shipping,
                'tax'              => 0,
                'total'            => $total,
                'currency'         => 'AMD',
                'customer_name'    => $customer['name'],
                'customer_email'   => $customer['email'],
                'customer_phone'   => $customer['phone'],
                'payment_method'   => 'idram',
                'shipping_address' => [
                    'address'     => $address['street'],
                    'district'    => $address['district'],
                    'city'        => 'Երևան',
                    'postal_code' => '0' . rand(1, 14) . '0' . rand(1, 9),
                    'country'     => 'Հայաստան',
                ],
                'paid_at'          => in_array($scenario['payment_status'], [PaymentStatus::Paid]) ? $createdAt->copy()->addMinutes(rand(5, 30)) : null,
                'shipped_at'       => in_array($scenario['status'], [OrderStatus::Shipped, OrderStatus::Delivered]) ? $createdAt->copy()->addDays(2) : null,
                'delivered_at'     => $scenario['status'] === OrderStatus::Delivered ? $createdAt->copy()->addDays(5) : null,
                'created_at'       => $createdAt,
                'updated_at'       => $createdAt,
            ]);

            OrderItem::create([
                'order_id'     => $order->id,
                'product_id'   => $product->id,
                'product_name' => $product->getTranslations('name'),
                'variant_name' => ['hy' => '', 'en' => ''],
                'quantity'     => $quantity,
                'unit_price'   => $product->price,
                'total_price'  => $product->price * $quantity,
            ]);
        }
    }
}
