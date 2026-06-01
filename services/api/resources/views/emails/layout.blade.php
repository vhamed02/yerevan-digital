<!DOCTYPE html>
<html lang="{{ $locale ?? config('app.locale') }}" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Vendorex')</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; -webkit-font-smoothing: antialiased; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ececef; box-shadow: 0 4px 24px rgba(24,24,27,0.06); }
        .header { background: #18181b; padding: 28px 40px; }
        .header .logo { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.4px; text-decoration: none; }
        .header .logo .dot { color: #818cf8; }
        .body { padding: 40px; }
        .body h1 { font-size: 21px; font-weight: 700; color: #18181b; margin: 0 0 12px; letter-spacing: -0.3px; }
        .body p { font-size: 15px; line-height: 1.65; color: #52525b; margin: 0 0 16px; }
        .btn { display: inline-block; padding: 12px 28px; background: #18181b; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; margin: 8px 0; }
        .btn:visited, .btn:hover, .btn:active { color: #ffffff !important; }
        .divider { border: none; border-top: 1px solid #ececef; margin: 0; }
        .footer { padding: 28px 40px 36px; text-align: center; }
        .footer p { font-size: 13px; color: #a1a1aa; margin: 4px 0; }
        .footer a { color: #6366f1; text-decoration: none; font-weight: 500; }
        .info-box { background: #f4f4f5; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
        .info-box p { margin: 4px 0; font-size: 14px; }
        .info-box strong { color: #18181b; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #dcfce7; color: #166534; }
        .detail { width: 100%; border-collapse: collapse; margin: 4px 0 8px; }
        .detail td { padding: 12px 0; border-bottom: 1px solid #f1f1f3; font-size: 15px; vertical-align: top; }
        .detail tr:last-child td { border-bottom: none; }
        .detail .label { color: #a1a1aa; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 92px; white-space: nowrap; }
        .detail .value { color: #18181b; font-weight: 500; }
        .detail .value a { color: #6366f1; text-decoration: none; }
        .quote { background: #fafafa; border: 1px solid #ececef; border-left: 3px solid #818cf8; border-radius: 8px; padding: 18px 20px; margin: 8px 0 4px; font-size: 15px; line-height: 1.65; color: #3f3f46; white-space: pre-line; }
        .eyebrow { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #818cf8; margin: 0 0 6px; }
        @media only screen and (max-width: 600px) {
            .wrapper { padding: 20px 12px !important; }
            .header { padding: 22px 24px !important; }
            .body { padding: 26px 24px !important; }
            .footer { padding: 22px 24px 28px !important; }
        }
    </style>
</head>
<body>
<div style="background-color: #f1f1f3; width: 100%;">
<div class="wrapper">
    <div class="card">
        <div class="header">
            <span class="logo">Vendorex<span class="dot">.</span></span>
        </div>
        <div class="body">
            @yield('content')
        </div>
        <hr class="divider">
        <div class="footer">
            <p>{{ __('emails.layout.tagline', [], $locale ?? config('app.locale')) }}</p>
            <p><a href="https://vendorex.shop">vendorex.shop</a> &nbsp;·&nbsp; <a href="mailto:support@vendorex.shop">support@vendorex.shop</a></p>
        </div>
    </div>
</div>
</div>
</body>
</html>
