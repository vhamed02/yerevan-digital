@extends('emails.layout')

@section('title', $locale === 'hy' ? 'Բարի գալուստ Vendora!' : 'Welcome to Vendora!')

@section('content')
@if($locale === 'hy')
<h1>Բարի գալուստ, {{ $user->name }}!</h1>
<p>Շնորհակալ ենք Vendora-ում գրանցվելու համար: Դուք հաջողությամբ ստեղծեցիք ձեր հաշիվը:</p>
<p>Vendora-ն ձեզ հնարավորություն է տալիս կառուցել ձեր սեփական հայկական խանութը՝ պրոֆեսիոնալ ձևավորումով, հայկական վճարային համակարգերով և հեշտ կառավարմամբ:</p>
<p><strong>Հաջորդ քայլերը</strong></p>
<div class="info-box">
    <p>① Ստեղծեք ձեր խանութը (անուն, slug, նկարագրություն)</p>
    <p>② Ավելացրեք ձեր ապրանքները</p>
    <p>③ Կարգավորեք վճարային համակարգը</p>
    <p>④ Կիսեք ձեր խանութի հղումը հաճախորդների հետ</p>
</div>
<a href="{{ config('app.url') }}/seller" class="btn">Անցնել Seller Panel</a>
@else
<h1>Welcome, {{ $user->name }}!</h1>
<p>Thank you for registering on Vendora. Your account has been created successfully.</p>
<p>Vendora lets you build your own Armenian online store with professional templates, local payment gateways, and easy management.</p>
<p><strong>Next steps</strong></p>
<div class="info-box">
    <p>① Create your store (name, slug, description)</p>
    <p>② Add your products</p>
    <p>③ Set up your payment gateway</p>
    <p>④ Share your store link with customers</p>
</div>
<a href="{{ config('app.url') }}/seller" class="btn">Go to Seller Panel</a>
@endif
@endsection
