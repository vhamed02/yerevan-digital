<?php

namespace App\Http\Controllers;

use App\Notifications\ContactMessageNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;

class ContactController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:120'],
            'email'   => ['nullable', 'email', 'max:200'],
            'phone'   => ['nullable', 'string', 'max:30'],
            'message' => ['required', 'string', 'min:10', 'max:3000'],
        ]);

        $to = config('app.contact_email', 'support@vendora.am');

        Notification::route('mail', $to)
            ->notify(new ContactMessageNotification(
                senderName:  $data['name'],
                senderEmail: $data['email'] ?? null,
                senderPhone: $data['phone'] ?? null,
                message:     $data['message'],
            ));

        return $this->success(null, 'Message sent.');
    }
}
