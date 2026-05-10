@extends('emails.layout')

@section('title', $locale === 'hy' ? "Նոր պատվեր #{$order->order_number}" : "New Order #{$order->order_number}")

@section('content')
@if($locale === 'hy')
<h1>Նոր պատվեր ստացվեց!</h1>
<p>Ձեր խանութը ստացավ նոր պատվեր:</p>
<div class="info-box">
    <p><strong>Պատվեր #</strong>: {{ $order->order_number }}</p>
    <p><strong>Հաճախոդ</strong>: {{ $order->customer_name }}</p>
    <p><strong>Ընդամենը</strong>: {{ number_format($order->total, 0) }} {{ $order->currency }}</p>
    <p><strong>Ապրանքներ</strong>: {{ $order->items->count() }} հատ</p>
</div>
<a href="{{ config('app.url') }}/seller/orders/{{ $order->uuid }}" class="btn">Դիտել Պատվերը</a>
@else
<h1>You have a new order!</h1>
<p>Your store just received a new order.</p>
<div class="info-box">
    <p><strong>Order #</strong>: {{ $order->order_number }}</p>
    <p><strong>Customer</strong>: {{ $order->customer_name }}</p>
    <p><strong>Total</strong>: {{ number_format($order->total, 0) }} {{ $order->currency }}</p>
    <p><strong>Items</strong>: {{ $order->items->count() }}</p>
</div>
<a href="{{ config('app.url') }}/seller/orders/{{ $order->uuid }}" class="btn">View Order</a>
@endif
@endsection
