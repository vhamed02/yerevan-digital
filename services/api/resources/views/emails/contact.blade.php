@extends('emails.layout')

@section('title', 'New contact message')

@section('content')
<p class="eyebrow">Contact form</p>
<h1>New message from {{ $senderName }}</h1>
<p>Someone reached out through the Vendorex contact form. Their details are below.</p>

<table class="detail" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
        <td class="label">Name</td>
        <td class="value">{{ $senderName }}</td>
    </tr>
    @if($senderEmail)
    <tr>
        <td class="label">Email</td>
        <td class="value"><a href="mailto:{{ $senderEmail }}">{{ $senderEmail }}</a></td>
    </tr>
    @endif
    @if($senderPhone)
    <tr>
        <td class="label">Phone</td>
        <td class="value">{{ $senderPhone }}</td>
    </tr>
    @endif
</table>

<hr class="divider">

<p class="eyebrow">Message</p>
<div class="quote">{{ $body }}</div>

@if($senderEmail)
<div style="margin-top:28px;">
    <a href="mailto:{{ $senderEmail }}" class="btn">Reply to {{ $senderName }}</a>
</div>
@endif
@endsection
