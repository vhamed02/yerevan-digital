@extends('emails.layout')

@section('title', $locale === 'hy' ? 'Ձեր խանութը կասեցված է' : 'Your store has been suspended')

@section('content')
@if($locale === 'hy')
<h1>{{ $user->name }}, ձեր խանութը կասեցված է</h1>
<p>Vendora-ի ադմինիստրատորը կասեցրել է ձեր <strong>{{ is_array($store->name) ? ($store->name['hy'] ?? '') : $store->name }}</strong> խանութը:</p>
@if($reason)
<div class="info-box">
    <p><strong>Պատճառ</strong>: {{ $reason }}</p>
</div>
@endif
<p>Եթե հարցեր ունեք, կապ հաստատեք մեր աջակցության թիմի հետ:</p>
<a href="mailto:support@vendora.am" class="btn">Կապ Աջակցության Հետ</a>
@else
<h1>{{ $user->name }}, your store has been suspended</h1>
<p>Your store <strong>{{ is_array($store->name) ? ($store->name['en'] ?? '') : $store->name }}</strong> has been suspended by the Vendora team.</p>
@if($reason)
<div class="info-box">
    <p><strong>Reason</strong>: {{ $reason }}</p>
</div>
@endif
<p>If you have questions, please contact our support team.</p>
<a href="mailto:support@vendora.am" class="btn">Contact Support</a>
@endif
@endsection
