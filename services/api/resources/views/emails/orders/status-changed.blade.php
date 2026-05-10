@extends('emails.layout')

@section('title', $locale === 'hy' ? "Պատվերի կարգավիճակ #{$order->order_number}" : "Order Status #{$order->order_number}")

@section('content')
@php
$statusLabels = [
    'hy' => ['pending' => 'Սպասվող', 'paid' => 'Վճարված', 'processing' => 'Մշակվող', 'shipped' => 'Ուղարկված', 'delivered' => 'Հասցված', 'cancelled' => 'Չեղարկված', 'refunded' => 'Վերադարձված'],
    'en' => ['pending' => 'Pending', 'paid' => 'Paid', 'processing' => 'Processing', 'shipped' => 'Shipped', 'delivered' => 'Delivered', 'cancelled' => 'Cancelled', 'refunded' => 'Refunded'],
];
$statusLabel = $statusLabels[$locale][$order->status->value] ?? $order->status->value;
@endphp
@if($locale === 'hy')
<h1>Ձեր պատվերի կարգավիճակը փոխվել է</h1>
<p>Ձեր <strong>#{{ $order->order_number }}</strong> պատվերի կարգավիճակը թարմացվել է:</p>
<div class="info-box">
    <p><strong>Պատվեր #</strong>: {{ $order->order_number }}</p>
    <p><strong>Կարգավիճակ</strong>: <span class="status-badge">{{ $statusLabel }}</span></p>
    <p><strong>Ընդամենը</strong>: {{ number_format($order->total, 0) }} {{ $order->currency }}</p>
</div>
@if($order->status->value === 'shipped')
<p>Ձեր պատվերն ուղարկվել է: Շուտով կստանաք ձեր ապրանքները:</p>
@elseif($order->status->value === 'delivered')
<p>Ձեր պատվերը հասցված է: Ջոկ գնումներ!</p>
@endif
@else
<h1>Your order status has been updated</h1>
<p>Your order <strong>#{{ $order->order_number }}</strong> status has been updated.</p>
<div class="info-box">
    <p><strong>Order #</strong>: {{ $order->order_number }}</p>
    <p><strong>Status</strong>: <span class="status-badge">{{ $statusLabel }}</span></p>
    <p><strong>Total</strong>: {{ number_format($order->total, 0) }} {{ $order->currency }}</p>
</div>
@if($order->status->value === 'shipped')
<p>Your order is on its way. You should receive it soon.</p>
@elseif($order->status->value === 'delivered')
<p>Your order has been delivered. Enjoy your purchase!</p>
@endif
@endif
@endsection
