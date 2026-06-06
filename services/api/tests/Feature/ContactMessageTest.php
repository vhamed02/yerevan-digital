<?php

namespace Tests\Feature;

use App\Notifications\ContactMessageNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class ContactMessageTest extends TestCase
{
    use RefreshDatabase;

    private function sendAndCapture(
        string $name,
        ?string $email = null,
        ?string $phone = null,
        string $message = 'Hello, I want your product. Help me.',
    ): Email {
        Notification::route('mail', 'support@example.com')
            ->notify(new ContactMessageNotification(
                senderName: $name,
                senderEmail: $email,
                senderPhone: $phone,
                message: $message,
            ));

        $messages = Mail::getSymfonyTransport()->messages();
        $this->assertCount(1, $messages, 'Expected exactly one email to be sent.');

        return $messages->first()->getOriginalMessage();
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

    public function test_contact_email_renders_through_mailer_with_vendorex_branding(): void
    {
        $email = $this->sendAndCapture(
            name: 'Hamed Najari',
            email: 'hamed@example.com',
            phone: '+905317696426',
            message: 'Hello, I want your product. Help me.',
        );

        $this->assertSame('New contact message from Hamed Najari', $email->getSubject());
        $this->assertSame('hamed@example.com', $email->getReplyTo()[0]->getAddress());

        $html = $email->getHtmlBody();

        $this->assertStringContainsString('Vendorex', $html);
        $this->assertStringNotContainsString('>Vendorex<', $html);
        $this->assertStringContainsString('vendorex.shop', $html);
        $this->assertStringContainsString('Hamed Najari', $html);
        $this->assertStringContainsString('hamed@example.com', $html);
        $this->assertStringContainsString('+905317696426', $html);
        $this->assertStringContainsString('Hello, I want your product. Help me.', $html);
        $this->assertStringNotContainsString('Illuminate\\Mail\\Message', $html);
    }

    public function test_contact_email_omits_optional_fields_when_absent(): void
    {
        $email = $this->sendAndCapture(
            name: 'Anonymous Visitor',
            message: 'Just a message with no contact details provided.',
        );

        $this->assertEmpty($email->getReplyTo());

        $html = $email->getHtmlBody();

        $this->assertStringContainsString('Anonymous Visitor', $html);
        $this->assertStringContainsString('Just a message with no contact details provided.', $html);
        $this->assertStringNotContainsString('Phone', $html);
        $this->assertStringNotContainsString('Reply to', $html);
    }
}
