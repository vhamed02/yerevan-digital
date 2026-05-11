<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sandbox Payment</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { background: #fff; border-radius: 12px; padding: 40px; max-width: 420px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,.08); text-align: center; }
        .badge { display: inline-block; background: #fff3cd; color: #856404; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; letter-spacing: .5px; margin-bottom: 24px; }
        h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }
        p  { font-size: 14px; color: #666; margin-bottom: 32px; }
        .info { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 32px; text-align: left; }
        .info-row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
        .info-row span:first-child { color: #888; }
        .info-row span:last-child { font-weight: 600; color: #1a1a2e; }
        .buttons { display: flex; flex-direction: column; gap: 12px; }
        button { padding: 14px 24px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity .15s; }
        button:hover { opacity: .88; }
        .btn-success { background: #28a745; color: #fff; }
        .btn-fail    { background: #dc3545; color: #fff; }
        .result { margin-top: 24px; padding: 14px; border-radius: 8px; font-size: 14px; font-weight: 600; display: none; }
        .result.success { background: #d4edda; color: #155724; }
        .result.fail    { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">🧪 SANDBOX MODE</div>
        <h1>Idram Payment Simulator</h1>
        <p>This is a sandbox environment. No real payment will be processed.</p>

        <div class="info">
            <div class="info-row">
                <span>Transaction</span>
                <span>{{ $transactionId ?? '—' }}</span>
            </div>
        </div>

        <div class="buttons">
            <button class="btn-success" onclick="simulate(true)">✓ Simulate Successful Payment</button>
            <button class="btn-fail"    onclick="simulate(false)">✗ Simulate Failed Payment</button>
        </div>

        <div id="result" class="result"></div>
    </div>

    <script>
        const transactionId = '{{ $transactionId ?? "" }}';
        const appUrl = '{{ $appUrl }}';

        async function simulate(success) {
            const resultEl = document.getElementById('result');
            resultEl.style.display = 'none';

            const mockData = {
                EDP_PAYER_ACCOUNT : 'sandbox_user',
                EDP_REC_ACCOUNT   : 'sandbox_merchant',
                EDP_AMOUNT        : '1000.00',
                EDP_BILL_NO       : transactionId,
                EDP_TRANS_ID      : 'SANDBOX-' + Date.now(),
                EDP_CHECKSUM      : success ? 'VALID_SANDBOX_CHECKSUM' : 'INVALID_CHECKSUM',
                EDP_SANDBOX       : '1',
            };

            resultEl.className = 'result ' + (success ? 'success' : 'fail');
            resultEl.textContent = success
                ? '✓ Payment simulated successfully. Redirecting…'
                : '✗ Payment failure simulated. Redirecting…';
            resultEl.style.display = 'block';

            setTimeout(() => {
                const redirectPath = success ? '/checkout/success' : '/checkout/failed';
                window.location.href = redirectPath + '?transaction_id=' + transactionId;
            }, 3000);
        }
    </script>
</body>
</html>
