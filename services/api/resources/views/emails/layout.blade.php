<!DOCTYPE html>
<html lang="{{ $locale ?? config('app.locale') }}" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Vendorex')</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: #6366f1; padding: 32px 40px; text-align: center; }
        .header .logo { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; text-decoration: none; }
        .body { padding: 40px; }
        .body h1 { font-size: 22px; font-weight: 700; color: #18181b; margin: 0 0 16px; }
        .body p { font-size: 15px; line-height: 1.6; color: #52525b; margin: 0 0 16px; }
        .btn { display: inline-block; padding: 12px 28px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 8px 0; }
        .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
        .footer { padding: 24px 40px; text-align: center; }
        .footer p { font-size: 13px; color: #a1a1aa; margin: 4px 0; }
        .footer a { color: #6366f1; text-decoration: none; }
        .info-box { background: #f4f4f5; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
        .info-box p { margin: 4px 0; font-size: 14px; }
        .info-box strong { color: #18181b; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #dcfce7; color: #166534; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="card">
        <div class="header">
            <span class="logo">Vendorex</span>
        </div>
        <div class="body">
            @yield('content')
        </div>
        <hr class="divider">
        <div class="footer">
            <p>{{ __('emails.layout.tagline', [], $locale ?? config('app.locale')) }}</p>
            <p><a href="{{ config('app.url') }}">vendorex.shop</a> &nbsp;·&nbsp; <a href="mailto:support@vendorex.shop">support@vendorex.shop</a></p>
        </div>
    </div>
</div>
</body>
</html>
