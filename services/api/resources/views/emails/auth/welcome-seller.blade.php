@extends('emails.layout')

@section('title', __('emails.welcome.subject', [], $locale))

@section('content')
<h1>{{ __('emails.welcome.heading', ['name' => $user->name], $locale) }}</h1>
<p>{{ __('emails.welcome.intro', [], $locale) }}</p>
<p>{{ __('emails.welcome.about', [], $locale) }}</p>
<p><strong>{{ __('emails.welcome.next_steps', [], $locale) }}</strong></p>
<div class="info-box">
    <p>① {{ __('emails.welcome.step1', [], $locale) }}</p>
    <p>② {{ __('emails.welcome.step2', [], $locale) }}</p>
    <p>③ {{ __('emails.welcome.step3', [], $locale) }}</p>
    <p>④ {{ __('emails.welcome.step4', [], $locale) }}</p>
</div>
<a href="{{ config('app.url') }}/seller" class="btn">{{ __('emails.welcome.panel', [], $locale) }}</a>
@endsection
