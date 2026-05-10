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
            'to' => array_map(
                fn($addr) => ['name' => $addr->getName(), 'email' => $addr->getAddress()],
                $email->getTo()
            ),
            'subject' => $email->getSubject(),
        ];

        if ($email->getHtmlBody()) {
            $payload['htmlContent'] = $email->getHtmlBody();
        }

        if ($email->getTextBody()) {
            $payload['textContent'] = $email->getTextBody();
        }

        if ($email->getCc()) {
            $payload['cc'] = array_map(
                fn($addr) => ['name' => $addr->getName(), 'email' => $addr->getAddress()],
                $email->getCc()
            );
        }

        if ($email->getBcc()) {
            $payload['bcc'] = array_map(
                fn($addr) => ['name' => $addr->getName(), 'email' => $addr->getAddress()],
                $email->getBcc()
            );
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

    public function __toString(): string
    {
        return 'brevo';
    }
}
