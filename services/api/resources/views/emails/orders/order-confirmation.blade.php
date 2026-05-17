@extends('emails.layout')

@section('title', "Order Confirmed — #{{ $order->order_number }}")

@section('content')
<h1>Your order is confirmed!</h1>
<p>Hi {{ $order->customer_name }}, thank you for your purchase. We've received your order and the seller will prepare it shortly.</p>

<div class="info-box">
    <p><strong>Order number:</strong> #{{ $order->order_number }}</p>
    <p><strong>Status:</strong> <span class="status-badge">Confirmed</span></p>
    <p><strong>Date:</strong> {{ $order->created_at->format('d M Y, H:i') }}</p>
</div>

<hr class="divider">

<h2 style="font-size:16px;font-weight:700;margin:0 0 12px;">Items ordered</h2>
<table style="width:100%;border-collapse:collapse;">
@foreach($order->items as $item)
    @php
        $name = is_array($item->product_name)
            ? ($item->product_name['hy'] ?? $item->product_name['en'] ?? '')
            : $item->product_name;
    @endphp
    <tr>
        <td style="padding:6px 0;font-size:14px;color:#18181b;">
            {{ $name }}
            @if($item->variant_name)
                <span style="color:#71717a;"> — {{ is_array($item->variant_name) ? implode(', ', array_map(fn($k,$v) => "$k: $v", array_keys($item->variant_name), $item->variant_name)) : $item->variant_name }}</span>
            @endif
        </td>
        <td style="padding:6px 0;font-size:14px;color:#71717a;text-align:center;">× {{ $item->quantity }}</td>
        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#18181b;text-align:right;">{{ number_format($item->total_price, 0) }} {{ $order->currency }}</td>
    </tr>
@endforeach
    <tr>
        <td colspan="2" style="padding:12px 0 4px;font-size:15px;font-weight:700;color:#18181b;border-top:1px solid #e4e4e7;">Total</td>
        <td style="padding:12px 0 4px;font-size:15px;font-weight:700;color:#18181b;text-align:right;border-top:1px solid #e4e4e7;">{{ number_format($order->total, 0) }} {{ $order->currency }}</td>
    </tr>
</table>

@if($order->shipping_address)
<hr class="divider">
<h2 style="font-size:16px;font-weight:700;margin:0 0 12px;">Delivery address</h2>
<div class="info-box">
    @if($order->shipping_address['line1'] ?? null)<p>{{ $order->shipping_address['line1'] }}</p>@endif
    @if($order->shipping_address['city'] ?? null)<p>{{ $order->shipping_address['city'] }}@if($order->shipping_address['postal_code'] ?? null) {{ $order->shipping_address['postal_code'] }}@endif</p>@endif
    @if($order->shipping_address['country'] ?? null)<p>{{ $order->shipping_address['country'] }}</p>@endif
</div>
@endif

<a href="{{ config('services.frontend_url', config('app.url')) }}/store/{{ $order->store->slug }}/order/{{ $order->uuid }}" class="btn">
    Track Your Order
</a>

<p style="margin-top:24px;font-size:13px;color:#a1a1aa;">
    If you have any questions, please contact the store directly or reply to this email.
</p>
@endsection
