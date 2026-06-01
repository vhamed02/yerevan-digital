<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Notifications\CustomerOrderConfirmationNotification;
use App\Notifications\NewOrderNotification;
use App\Notifications\OrderStatusChangedNotification;
use App\Notifications\OrdersExportedNotification;
use App\Notifications\StoreApprovedNotification;
use App\Notifications\StoreSuspendedNotification;
use App\Notifications\WelcomeSellerNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Tests\TestCase;

class EmailLocalizationTest extends TestCase
{
    use RefreshDatabase;

    private function render(\Illuminate\Notifications\Messages\MailMessage $mail): string
    {
        return view($mail->view, $mail->viewData)->render();
    }

    public function test_customer_order_confirmation_uses_order_locale(): void
    {
        $store   = Store::factory()->create();
        $product = Product::factory()->for($store)->create();
        $order   = Order::factory()->for($store)->create(['locale' => 'ru']);
        OrderItem::factory()->for($order)->create([
            'product_id'   => $product->id,
            'product_name' => ['hy' => 'Անուն', 'en' => 'English Name', 'ru' => 'Русское название'],
        ]);

        $mail = (new CustomerOrderConfirmationNotification($order))->toMail(new AnonymousNotifiable);

        $this->assertStringContainsString('Заказ подтверждён', $mail->subject);
        $html = $this->render($mail);
        $this->assertStringContainsString('Ваш заказ подтверждён!', $html);
        $this->assertStringContainsString('Отследить заказ', $html);
        $this->assertStringContainsString('Русское название', $html);
    }

    public function test_customer_order_confirmation_falls_back_when_locale_missing(): void
    {
        $store   = Store::factory()->create();
        $product = Product::factory()->for($store)->create();
        $order   = Order::factory()->for($store)->create(['locale' => null]);
        OrderItem::factory()->for($order)->create(['product_id' => $product->id]);

        $mail = (new CustomerOrderConfirmationNotification($order))->toMail(new AnonymousNotifiable);

        $this->assertStringContainsString('Order Confirmed', $mail->subject);
    }

    public function test_new_order_uses_seller_locale(): void
    {
        $seller  = User::factory()->create(['locale' => 'ru']);
        $store   = Store::factory()->for($seller, 'owner')->create();
        $product = Product::factory()->for($store)->create();
        $order   = Order::factory()->for($store)->create();
        OrderItem::factory()->for($order)->create(['product_id' => $product->id]);

        $mail = (new NewOrderNotification($order))->toMail($seller);

        $this->assertStringContainsString('Новый заказ', $mail->subject);
        $html = $this->render($mail);
        $this->assertStringContainsString('У вас новый заказ!', $html);
        $this->assertStringContainsString('Посмотреть заказ', $html);
    }

    public function test_order_status_changed_translates_status_label(): void
    {
        $store = Store::factory()->create();
        $order = Order::factory()->for($store)->create([
            'locale' => 'ru',
            'status' => OrderStatus::Shipped,
        ]);

        $mail = (new OrderStatusChangedNotification($order))->toMail(new AnonymousNotifiable);

        $this->assertStringContainsString('Статус вашего заказа изменён', $mail->subject);
        $html = $this->render($mail);
        $this->assertStringContainsString('Отправлен', $html);
        $this->assertStringContainsString('Ваш заказ в пути', $html);
    }

    public function test_store_approved_uses_seller_locale(): void
    {
        $seller = User::factory()->create(['locale' => 'ru']);
        $store  = Store::factory()->for($seller, 'owner')->create();

        $mail = (new StoreApprovedNotification($store))->toMail($seller);

        $this->assertStringContainsString('доступен на Vendorex', $mail->subject);
        $html = $this->render($mail);
        $this->assertStringContainsString('Поздравляем', $html);
        $this->assertStringContainsString('Управлять магазином', $html);
    }

    public function test_store_suspended_uses_seller_locale(): void
    {
        $seller = User::factory()->create(['locale' => 'ru']);
        $store  = Store::factory()->for($seller, 'owner')->create();

        $mail = (new StoreSuspendedNotification($store, 'spam'))->toMail($seller);

        $this->assertStringContainsString('приостановлен', $mail->subject);
        $html = $this->render($mail);
        $this->assertStringContainsString('Причина', $html);
        $this->assertStringContainsString('Связаться с поддержкой', $html);
    }

    public function test_welcome_seller_uses_seller_locale(): void
    {
        $seller = User::factory()->create(['locale' => 'ru']);

        $mail = (new WelcomeSellerNotification)->toMail($seller);

        $this->assertStringContainsString('Добро пожаловать в Vendorex', $mail->subject);
        $html = $this->render($mail);
        $this->assertStringContainsString('Следующие шаги', $html);
        $this->assertStringContainsString('Перейти в панель продавца', $html);
    }

    public function test_orders_export_uses_seller_locale(): void
    {
        $seller = User::factory()->create(['locale' => 'ru']);

        $mail = (new OrdersExportedNotification('id,name', 'My Store'))->toMail($seller);

        $this->assertStringContainsString('Экспорт заказов', $mail->subject);
    }
}
