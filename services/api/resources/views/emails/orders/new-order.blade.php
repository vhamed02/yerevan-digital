@extends('emails.layout')

@section('title', __('emails.new_order.subject', ['number' => $order->order_number], $locale))

@section('content')
<h1>{{ __('emails.new_order.heading', [], $locale) }}</h1>
<p>{{ __('emails.new_order.intro', [], $locale) }}</p>
<div class="info-box">
    <p><strong>{{ __('emails.new_order.number', [], $locale) }}</strong>: {{ $order->order_number }}</p>
    <p><strong>{{ __('emails.new_order.customer', [], $locale) }}</strong>: {{ $order->customer_name }}</p>
    <p><strong>{{ __('emails.new_order.total', [], $locale) }}</strong>: {{ number_format($order->total, 0) }} {{ $order->currency }}</p>
    <p><strong>{{ __('emails.new_order.items', [], $locale) }}</strong>: {{ $order->items->count() }}</p>
</div>
<a href="{{ config('app.url') }}/seller/orders/{{ $order->uuid }}" class="btn">{{ __('emails.new_order.view', [], $locale) }}</a>
@endsection
