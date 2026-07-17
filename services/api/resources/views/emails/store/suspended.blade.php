@extends('emails.layout')

@section('title', __('emails.store_suspended.subject', [], $locale))

@section('content')
<h1>{{ __('emails.store_suspended.heading', ['name' => $user->name], $locale) }}</h1>
<p>{{ __('emails.store_suspended.intro', ['store' => $store->getTranslation('name', $locale)], $locale) }}</p>
@if($reason)
<div class="info-box">
    <p><strong>{{ __('emails.store_suspended.reason', [], $locale) }}</strong>: {{ $reason }}</p>
</div>
@endif
<p>{{ __('emails.store_suspended.body', [], $locale) }}</p>
<a href="mailto:support@yerevan.digital" class="btn">{{ __('emails.store_suspended.contact', [], $locale) }}</a>
@endsection
