@extends('emails.layout')

@section('title', __('emails.store_approved.subject', [], $locale))

@section('content')
<h1>{{ __('emails.store_approved.heading', ['name' => $user->name], $locale) }}</h1>
<p>{{ __('emails.store_approved.intro', [], $locale) }}</p>
<div class="info-box">
    <p><strong>{{ __('emails.store_approved.store', [], $locale) }}</strong>: {{ $store->getTranslation('name', $locale) }}</p>
    <p><strong>{{ __('emails.store_approved.url', [], $locale) }}</strong>: {{ config('app.url') }}/store/{{ $store->slug }}</p>
    <p><span class="status-badge">{{ __('emails.store_approved.active', [], $locale) }}</span></p>
</div>
<p>{{ __('emails.store_approved.body', [], $locale) }}</p>
<a href="{{ config('app.url') }}/seller" class="btn">{{ __('emails.store_approved.manage', [], $locale) }}</a>
@endsection
