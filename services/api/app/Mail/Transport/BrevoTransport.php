<?php

namespace App\Mail\Transport;

use GuzzleHttp\ClientInterface;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;

class BrevoTransport extends AbstractTransport
{
    public function __construct(
        private readonly string $apiKey,
        private readonly ClientInterface $client,
    ) {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email   = MessageConverter::toEmail($message->getOriginalMessage());
        $payload = [
            'sender' => [
                'name'  => $email->getFrom()[0]->getName() ?: $email->getFrom()[0]->getAddress(),
                'email' => $email->getFrom()[0]->getAddress(),
            ],
            'to'      => $this->addresses($email->getTo()),
            'subject' => $email->getSubject(),
        ];

        if ($email->getHtmlBody()) {
            $payload['htmlContent'] = $email->getHtmlBody();
        }

        if ($email->getTextBody()) {
            $payload['textContent'] = $email->getTextBody();
        }

        if ($email->getCc()) {
            $payload['cc'] = $this->addresses($email->getCc());
        }

        if ($email->getBcc()) {
            $payload['bcc'] = $this->addresses($email->getBcc());
        }

        $this->client->request('POST', 'https://api.brevo.com/v3/smtp/email', [
            'headers' => [
                'api-key'      => $this->apiKey,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ],
            'json' => $payload,
        ]);
    }

    /**
     * Map Symfony addresses to Brevo's shape.
     *
     * Brevo rejects `{"name": "", "email": ...}` with `name is missing in to` —
     * an empty name is worse than no name at all. Laravel's notification channel
     * routes by bare email address (no display name), so every notification hit
     * this until the key was omitted when there is nothing to put in it.
     *
     * @param  \Symfony\Component\Mime\Address[]  $addresses
     * @return array<int, array{email: string, name?: string}>
     */
    private function addresses(array $addresses): array
    {
        return array_map(function ($addr) {
            $entry = ['email' => $addr->getAddress()];

            if ($addr->getName() !== '') {
                $entry['name'] = $addr->getName();
            }

            return $entry;
        }, $addresses);
    }

    public function __toString(): string
    {
        return 'brevo';
    }
}
