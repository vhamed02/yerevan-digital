<?php

namespace Tests\Unit;

use App\Mail\Transport\BrevoTransport;
use GuzzleHttp\ClientInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

class BrevoTransportTest extends TestCase
{
    /** @return array{0: BrevoTransport, 1: array<string, mixed>} */
    private function sendAndCapture(Email $email): array
    {
        $captured = [];

        $client = new class($captured) implements ClientInterface {
            public function __construct(public array &$captured) {}

            public function request($method, $uri, array $options = []): \Psr\Http\Message\ResponseInterface
            {
                $this->captured = $options['json'] ?? [];

                return new \GuzzleHttp\Psr7\Response(201, [], '{"messageId":"1"}');
            }

            public function send(\Psr\Http\Message\RequestInterface $r, array $o = []): \Psr\Http\Message\ResponseInterface
            {
                return new \GuzzleHttp\Psr7\Response(201);
            }

            public function sendAsync(\Psr\Http\Message\RequestInterface $r, array $o = []): \GuzzleHttp\Promise\PromiseInterface
            {
                return new \GuzzleHttp\Promise\FulfilledPromise(new \GuzzleHttp\Psr7\Response(201));
            }

            public function requestAsync($m, $u, array $o = []): \GuzzleHttp\Promise\PromiseInterface
            {
                return new \GuzzleHttp\Promise\FulfilledPromise(new \GuzzleHttp\Psr7\Response(201));
            }

            public function getConfig(?string $option = null) { return null; }
        };

        (new BrevoTransport('test-key', $client))->send($email);

        return [$client->captured, $client->captured];
    }

    /**
     * Brevo answers `name is missing in to` for `{"name":"","email":…}`, and
     * Laravel's notification channel routes by bare address — so every
     * notification failed until the empty key was dropped.
     */
    public function test_a_recipient_without_a_display_name_omits_the_name_key(): void
    {
        $email = (new Email())
            ->from(new Address('noreply@yerevan.digital', 'Yerevan Digital'))
            ->to(new Address('shopper@example.am'))
            ->subject('Order confirmed')
            ->text('Thanks');

        [$payload] = $this->sendAndCapture($email);

        $this->assertSame([['email' => 'shopper@example.am']], $payload['to']);
        $this->assertArrayNotHasKey('name', $payload['to'][0]);
    }

    public function test_a_display_name_is_passed_through_when_present(): void
    {
        $email = (new Email())
            ->from(new Address('noreply@yerevan.digital', 'Yerevan Digital'))
            ->to(new Address('shopper@example.am', 'Ani Petrosyan'))
            ->subject('Order confirmed')
            ->text('Thanks');

        [$payload] = $this->sendAndCapture($email);

        $this->assertSame([['email' => 'shopper@example.am', 'name' => 'Ani Petrosyan']], $payload['to']);
    }

    public function test_cc_and_bcc_drop_empty_names_too(): void
    {
        $email = (new Email())
            ->from(new Address('noreply@yerevan.digital', 'Yerevan Digital'))
            ->to(new Address('shopper@example.am'))
            ->cc(new Address('cc@example.am'))
            ->bcc(new Address('bcc@example.am', 'Named Bcc'))
            ->subject('Order confirmed')
            ->text('Thanks');

        [$payload] = $this->sendAndCapture($email);

        $this->assertSame([['email' => 'cc@example.am']], $payload['cc']);
        $this->assertSame([['email' => 'bcc@example.am', 'name' => 'Named Bcc']], $payload['bcc']);
    }

    public function test_sender_falls_back_to_the_address_when_unnamed(): void
    {
        $email = (new Email())
            ->from(new Address('noreply@yerevan.digital'))
            ->to(new Address('shopper@example.am'))
            ->subject('Order confirmed')
            ->text('Thanks');

        [$payload] = $this->sendAndCapture($email);

        $this->assertSame('noreply@yerevan.digital', $payload['sender']['name']);
    }
}
