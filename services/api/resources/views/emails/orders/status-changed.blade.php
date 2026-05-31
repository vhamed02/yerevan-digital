@extends('emails.layout')

@section('title', __('emails.status_changed.subject', ['number' => $order->order_number], $locale))

@section('content')
@php
    $statusLabel = __('emails.status.' . $order->status->value, [], $locale);
@endphp
<h1>{{ __('emails.status_changed.heading', [], $locale) }}</h1>
<p>{{ __('emails.status_changed.intro', ['number' => $order->order_number], $locale) }}</p>
<div class="info-box">
    <p><strong>{{ __('emails.status_changed.number', [], $locale) }}</strong>: {{ $order->order_number }}</p>
    <p><strong>{{ __('emails.status_changed.status', [], $locale) }}</strong>: <span class="status-badge">{{ $statusLabel }}</span></p>
    <p><strong>{{ __('emails.status_changed.total', [], $locale) }}</strong>: {{ number_format($order->total, 0) }} {{ $order->currency }}</p>
</div>
@if($order->status->value === 'shipped')
<p>{{ __('emails.status_changed.shipped', [], $locale) }}</p>
@elseif($order->status->value === 'delivered')
<p>{{ __('emails.status_changed.delivered', [], $locale) }}</p>
@endif
@endsection
