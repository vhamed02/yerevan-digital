@extends('emails.layout')

@section('title', __('emails.commission_invoice.subject', [], $locale))

@section('content')
<h1>{{ __('emails.commission_invoice.heading', [], $locale) }}</h1>
<p>{{ __('emails.commission_invoice.line', [], $locale) }}</p>
<div class="info-box">
    <p><strong>{{ __('emails.commission_invoice.amount_label', [], $locale) }}</strong>: {{ number_format($amount, 0) }} AMD</p>
    <p><strong>{{ __('emails.commission_invoice.period_label', [], $locale) }}</strong>: {{ $period_start->toDateString() }} &ndash; {{ $period_end->toDateString() }}</p>
</div>
<a href="{{ $payUrl }}" class="btn">{{ __('emails.commission_invoice.pay_button', [], $locale) }}</a>
@endsection
