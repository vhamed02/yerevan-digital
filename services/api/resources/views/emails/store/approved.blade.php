@extends('emails.layout')

@section('title', $locale === 'hy' ? 'Ձեր խանութը հաստատված է!' : 'Your store is now live!')

@section('content')
@if($locale === 'hy')
<h1>Շնորհավո՛ր, {{ $user->name }}!</h1>
<p>Ձեր խանութը հաստատվել է Vendora ադմինիստրատորի կողմից:</p>
<div class="info-box">
    <p><strong>Խանութ</strong>: {{ is_array($store->name) ? ($store->name['hy'] ?? '') : $store->name }}</p>
    <p><strong>Հասցե</strong>: {{ config('app.url') }}/store/{{ $store->slug }}</p>
    <p><span class="status-badge">Ակտիվ</span></p>
</div>
<p>Այժմ ձեր հաճախորդները կարող են գտնել ձեր խանութը Vendora հարթակում:</p>
<a href="{{ config('app.url') }}/seller" class="btn">Կառավարել Խանութը</a>
@else
<h1>Congratulations, {{ $user->name }}!</h1>
<p>Your store has been approved by the Vendora team and is now live.</p>
<div class="info-box">
    <p><strong>Store</strong>: {{ is_array($store->name) ? ($store->name['en'] ?? '') : $store->name }}</p>
    <p><strong>URL</strong>: {{ config('app.url') }}/store/{{ $store->slug }}</p>
    <p><span class="status-badge">Active</span></p>
</div>
<p>Your customers can now find and shop at your store on Vendora.</p>
<a href="{{ config('app.url') }}/seller" class="btn">Manage Your Store</a>
@endif
@endsection
