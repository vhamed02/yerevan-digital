<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sandbox Payment — Vendora</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f13;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .container {
            width: 100%;
            max-width: 420px;
        }

        /* Sandbox banner */
        .sandbox-banner {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #1a1a00;
            border: 1px solid #3d3a00;
            border-radius: 10px;
            padding: 10px 14px;
            margin-bottom: 20px;
        }
        .sandbox-dot {
            width: 8px; height: 8px;
            background: #f5c400;
            border-radius: 50%;
            animation: pulse 1.6s ease-in-out infinite;
            flex-shrink: 0;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.4; }
        }
        .sandbox-banner span {
            font-size: 12px;
            font-weight: 600;
            color: #f5c400;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        /* Card visual */
        .card-visual {
            background: linear-gradient(135deg, #1c1c2e 0%, #2d1b69 50%, #1a1a3e 100%);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            position: relative;
            overflow: hidden;
            min-height: 180px;
            border: 1px solid rgba(255,255,255,0.08);
        }
        .card-visual::before {
            content: '';
            position: absolute;
            top: -60px; right: -60px;
            width: 200px; height: 200px;
            background: rgba(139, 92, 246, 0.15);
            border-radius: 50%;
        }
        .card-visual::after {
            content: '';
            position: absolute;
            bottom: -40px; left: -40px;
            width: 150px; height: 150px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 50%;
        }
        .card-chip {
            width: 36px; height: 28px;
            background: linear-gradient(135deg, #d4a843, #f5d78e);
            border-radius: 5px;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }
        .card-number {
            font-size: 18px;
            font-family: 'Courier New', monospace;
            letter-spacing: 3px;
            color: rgba(255,255,255,0.9);
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }
        .card-bottom {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            position: relative;
            z-index: 1;
        }
        .card-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: rgba(255,255,255,0.4);
            margin-bottom: 3px;
        }
        .card-value {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            font-weight: 500;
        }
        .card-logo {
            font-size: 22px;
            font-weight: 800;
            color: rgba(255,255,255,0.7);
            font-style: italic;
            letter-spacing: -0.5px;
        }

        /* Form card */
        .form-card {
            background: #1a1a24;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 24px;
        }

        .form-title {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 4px;
        }
        .form-subtitle {
            font-size: 13px;
            color: rgba(255,255,255,0.4);
            margin-bottom: 20px;
        }

        .field { margin-bottom: 14px; }
        .field label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: rgba(255,255,255,0.4);
            margin-bottom: 6px;
        }
        .field input {
            width: 100%;
            height: 44px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 0 14px;
            font-size: 14px;
            color: rgba(255,255,255,0.7);
            outline: none;
            transition: border-color 0.15s;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
        }
        .field input:focus {
            border-color: rgba(139, 92, 246, 0.6);
        }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* Order summary */
        .order-summary {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 20px;
        }
        .order-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
        }
        .order-row + .order-row {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255,255,255,0.06);
        }
        .order-row span:first-child { color: rgba(255,255,255,0.4); }
        .order-row .amount {
            font-size: 15px;
            font-weight: 700;
            color: #fff;
        }

        /* Buttons */
        .btn-group { display: flex; flex-direction: column; gap: 10px; }
        .btn {
            width: 100%;
            height: 50px;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.1s, opacity 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .btn:active { transform: scale(0.98); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-success {
            background: linear-gradient(135deg, #059669, #10b981);
            color: #fff;
            box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
        }
        .btn-fail {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.6);
        }
        .btn-fail:hover:not(:disabled) {
            background: rgba(239,68,68,0.1);
            border-color: rgba(239,68,68,0.3);
            color: #f87171;
        }

        /* Loading / result states */
        .spinner {
            width: 18px; height: 18px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            display: none;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .result-banner {
            display: none;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 14px;
        }
        .result-banner.success {
            background: rgba(16,185,129,0.12);
            border: 1px solid rgba(16,185,129,0.25);
            color: #6ee7b7;
        }
        .result-banner.fail {
            background: rgba(239,68,68,0.1);
            border: 1px solid rgba(239,68,68,0.2);
            color: #fca5a5;
        }
    </style>
</head>
<body>
    <div class="container">

        <div class="sandbox-banner">
            <div class="sandbox-dot"></div>
            <span>Sandbox Mode — No real payment will be processed</span>
        </div>

        <div class="card-visual">
            <div class="card-chip"></div>
            <div class="card-number">4242  4242  4242  4242</div>
            <div class="card-bottom">
                <div>
                    <div class="card-label">Card Holder</div>
                    <div class="card-value">TEST USER</div>
                </div>
                <div>
                    <div class="card-label">Expires</div>
                    <div class="card-value">12/30</div>
                </div>
                <div class="card-logo">VISA</div>
            </div>
        </div>

        <div class="form-card">
            <div class="form-title">Card Details</div>
            <div class="form-subtitle">Pre-filled with test data — nothing is charged</div>

            <div class="field">
                <label>Card Number</label>
                <input type="text" value="4242 4242 4242 4242" readonly>
            </div>

            <div class="field-row">
                <div class="field">
                    <label>Expiry Date</label>
                    <input type="text" value="12 / 30" readonly>
                </div>
                <div class="field">
                    <label>CVV</label>
                    <input type="text" value="123" readonly>
                </div>
            </div>

            <div class="field">
                <label>Cardholder Name</label>
                <input type="text" value="TEST USER" readonly style="font-family: inherit; letter-spacing: normal;">
            </div>

            <div class="order-summary">
                <div class="order-row">
                    <span>Order</span>
                    <span style="color:rgba(255,255,255,0.6); font-family:'Courier New',monospace; font-size:12px;">
                        {{ Str::upper(Str::substr($orderId ?? '', 0, 8)) }}…
                    </span>
                </div>
                <div class="order-row">
                    <span>Total</span>
                    <span class="amount">{{ $amount }} {{ $currency }}</span>
                </div>
            </div>

            <div id="result" class="result-banner"></div>

            <div class="btn-group">
                <button class="btn btn-success" id="btn-success" onclick="complete('success')">
                    <div class="spinner" id="spin-success"></div>
                    <span id="label-success">✓ &nbsp;Pay Successfully</span>
                </button>
                <button class="btn btn-fail" id="btn-fail" onclick="complete('fail')">
                    <div class="spinner" id="spin-fail"></div>
                    <span id="label-fail">✕ &nbsp;Simulate Failure</span>
                </button>
            </div>
        </div>

    </div>

    <script>
        const ORDER_ID = '{{ $orderId ?? "" }}';
        const API_URL  = '{{ $apiUrl }}';

        async function complete(outcome) {
            const btnSuccess = document.getElementById('btn-success');
            const btnFail    = document.getElementById('btn-fail');
            const result     = document.getElementById('result');
            const isSuccess  = outcome === 'success';

            btnSuccess.disabled = true;
            btnFail.disabled    = true;
            document.getElementById('spin-' + outcome).style.display = 'block';
            document.getElementById('label-' + outcome).style.display = 'none';

            result.style.display = 'none';

            try {
                const res = await fetch(API_URL + '/api/v1/store/payments/sandbox/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ order_id: ORDER_ID, outcome }),
                });

                const json = await res.json();

                if (json.success && json.data?.redirect) {
                    result.className = 'result-banner ' + (isSuccess ? 'success' : 'fail');
                    result.textContent = isSuccess
                        ? '✓ Payment confirmed — redirecting…'
                        : '✕ Payment declined — redirecting…';
                    result.style.display = 'flex';

                    setTimeout(() => { window.location.href = json.data.redirect; }, 1400);
                } else {
                    throw new Error(json.message ?? 'Unexpected error');
                }
            } catch (err) {
                result.className = 'result-banner fail';
                result.textContent = '✕ ' + (err.message ?? 'Something went wrong');
                result.style.display = 'flex';

                btnSuccess.disabled = false;
                btnFail.disabled    = false;
                document.getElementById('spin-' + outcome).style.display = 'none';
                document.getElementById('label-' + outcome).style.display = 'inline';
            }
        }
    </script>
</body>
</html>
