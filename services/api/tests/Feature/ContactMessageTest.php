<?php

namespace Tests\Feature;

use App\Notifications\ContactMessageNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ContactMessageTest extends TestCase
{
    use RefreshDatabase;

    private function render(MailMessage $mail): string
    {
        return view($mail->view, $mail->viewData)->render();
    }

    public function test_contact_endpoint_dispatches_notification(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/contact', [
            'name'    => 'Hamed Najari',
            'email'   => 'hamed@example.com',
            'phone'   => '+905317696426',
            'message' => 'Hello, I want your product. Help me.',
        ]);

        $response->assertOk();
        Notification::assertSentOnDemand(ContactMessageNotification::class);
    }

    public function test_contact_endpoint_validates_message_length(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/contact', [
            'name'    => 'Hamed Najari',
            'message' => 'too short',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('message');
        Notification::assertNothingSent();
    }

    public function test_contact_email_uses_vendorex_branding_and_reply_to(): void
    {
        $mail = (new ContactMessageNotification(
            senderName: 'Hamed Najari',
            senderEmail: 'hamed@example.com',
            senderPhone: '+905317696426',
            message: 'Hello, I want your product. Help me.',
        ))->toMail(new AnonymousNotifiable);

        $this->assertSame('New contact message from Hamed Najari', $mail->subject);
        $this->assertSame('hamed@example.com', $mail->replyTo[0][0]);

        $html = $this->render($mail);

        $this->assertStringContainsString('Vendorex', $html);
        $this->assertStringNotContainsString('>Vendora<', $html);
        $this->assertStringContainsString('vendorex.shop', $html);
        $this->assertStringContainsString('Hamed Najari', $html);
        $this->assertStringContainsString('hamed@example.com', $html);
        $this->assertStringContainsString('+905317696426', $html);
        $this->assertStringContainsString('Hello, I want your product. Help me.', $html);
    }

    public function test_contact_email_omits_optional_fields_when_absent(): void
    {
        $mail = (new ContactMessageNotification(
            senderName: 'Anonymous Visitor',
            senderEmail: null,
            senderPhone: null,
            message: 'Just a message with no contact details provided.',
        ))->toMail(new AnonymousNotifiable);

        $this->assertEmpty($mail->replyTo);

        $html = $this->render($mail);

        $this->assertStringContainsString('Anonymous Visitor', $html);
        $this->assertStringNotContainsString('Phone', $html);
        $this->assertStringNotContainsString('Reply to', $html);
    }
}
