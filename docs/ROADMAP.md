# Yerevan Digital — Roadmap & Status

**Last updated:** 2026-08-04 · **HEAD when written:** `5e1707b`

Companion to `CLAUDE.md` (which holds the how: deploy, architecture, pitfalls).
This file holds the **what**: what is done, what is not, and what to pick up next.
Read `CLAUDE.md` first — it is loaded automatically and is not repeated here.

---

## Current state

| Fact | Value | How to re-check |
|------|-------|-----------------|
| Stores / products / orders | **0 / 0 / 0** — pre-launch, never had real traffic | `curl -s https://api.yerevan.digital/api/v1/stats` |
| API tests | 525 passing | see `CLAUDE.md` → "Running tests" |
| Web tests | 81 passing | `npm test` in a node container |
| Business model | Free to launch, **per-sale commission** (default 5%) | `services/web/src/messages/en.json` → `pricing` |
| Market | Armenia · AMD · trilingual hy/en/ru | — |

Because there is **zero production data**, schema and semantic changes are still cheap.
That window closes the moment real orders land.

---

## Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| **P0** | Scheduler + commission engine | ✅ **DONE** (2026-07-15) |
| **P1** | Coupons + shipping zones + seller analytics | ✅ **DONE** (2026-07-15) |
| **P2** | Cart recovery + self-serve upgrade + Telegram | ❌ **NOT STARTED** (deliberately skipped for now) |
| **P3** | Custom domains + search + wishlist | ✅ **DONE** (2026-07-16) — except wallets (blocked) and CSV import (dropped) |

---

## ✅ P0 — Revenue engine (DONE)

The platform advertised a per-sale commission but had **no monetization code at all**.

| Delivered | Where |
|-----------|-------|
| `commissions` append-only ledger | `database/migrations/2026_07_15_000002_*` |
| Accrual inside the payment transaction | `app/Actions/HandlePaymentSuccessAction.php` |
| Reversal on cancel/refund | `app/Http/Controllers/Seller/OrderController.php::updateStatus` |
| Rate resolution + money maths | `app/Services/CommissionService.php` |
| Admin ledger + rate UI | `/admin/commissions`, `components/admin/StoreCommissionCard.tsx` |
| `scheduler` container (`schedule:work`) | `docker-compose*.yml` + `scripts/deploy.sh` |

Design rationale lives in `CLAUDE.md` → "Commission engine". **The load-bearing rule:**
accrual runs in the same `DB::transaction` as the order flipping to paid. Never move it
to a queued listener or a separate service.

**Also fixed during P0:** auto-deploy had been silently dead since 2026-06-22 —
`/etc/webhook.conf` still pointed at the pre-rename `/home/vendorex` path. A
matched-but-failed hook still returns HTTP 200, so GitHub reported the webhook as
healthy. See `CLAUDE.md` → "Deploy workflow".

---

## ✅ P1 — Merchant-ready (DONE)

| Delivered | Where |
|-----------|-------|
| Coupons (fixed/percent, min order, date window, usage limit, percent cap) | `app/Services/CouponService.php`, `app/Models/Coupon.php` |
| Shipping zones (city match → fallback zone → free; free-over threshold) | `app/Services/ShippingService.php`, `app/Models/ShippingZone.php` |
| Both applied in the order transaction | `app/Actions/CreateOrderAction.php` |
| Seller UIs | `/seller/coupons`, `/seller/shipping` |
| Storefront coupon field (both templates, trilingual) | `hooks/useCheckoutTotals.ts`, `components/store/CouponField.tsx` |
| Analytics: best sellers, AOV, conversion | `Seller/DashboardController.php`, `OrderRepository::topProductsByStore` |
| `App\Support\Money` — one home for decimal maths | `app/Support/Money.php` |

Details and gotchas in `CLAUDE.md` → "Coupons & shipping" and "Seller analytics".

**Semantic change made in P1:** revenue now means *paid and not cancelled/refunded*
(`Order::scopeRevenueCounted()`). It previously summed **every** order, counting pending
and cancelled ones as money earned. Safe to change only because there were 0 orders.

---

## ❌ P2 — Growth (NOT STARTED)

All four verified absent in the codebase as of `1105a75`.

| # | Feature | Why | Depends on | Impact | Effort |
|---|---------|-----|-----------|--------|--------|
| 1 | **Abandoned-cart recovery** | Industry-standard 5–10% GMV recovery. Reuses Brevo + `queue`. | `scheduler` ✅ (P0) — plus cart persistence, which does **not** exist server-side yet (cart is Zustand/localStorage only) | High | M |
| 2 | **Self-serve Business upgrade** | Pricing says *"Let's talk"* → a contact form. Manual sales bottleneck. | Commission engine ✅ (P0) — per-store rate override already works | Med-High | M |
| 3 | **Telegram order notifications** | Telegram dominance in Armenia; sellers live there. | `queue` ✅ | Medium | S |
| 4 | **Low-stock alerts** | `products.manage_stock` + `stock` already exist. Cheap win. | `scheduler` ✅ | Medium | S |

**Note on #1:** the cart is client-only (`stores/cart.store.ts`, persisted to localStorage).
Recovery needs a server-side cart or an at-checkout email capture first — that's the real
work, not the email.

---

## ✅ P3 — Scale (DONE, with two exclusions)

| Delivered | Where |
|-----------|-------|
| Custom domains (TXT verification, Host→store routing, seller UI) | `app/Services/DomainService.php`, `proxy.ts`, `/seller/domain` |
| Product search hy/en/ru + SKU (SQL `LIKE`; Meilisearch removed 2026-07-26) | `ProductRepository::paginatePublicByStore()` |
| Real wishlist (per-account, login-gated) | `app/Models/WishlistItem.php`, `hooks/useWishlist.ts`, `/account/wishlist` |
| Admin settings 422 fix | `UpdateSettingsRequest`, `SettingsAdminClient.tsx` |

Design notes in `CLAUDE.md` → "Custom domains & search", and [`docs/custom-domains.md`](custom-domains.md).

### Excluded from P3

| # | Feature | Why not |
|---|---------|---------|
| 1 | **Telcell wallet** | ✅ **DONE (2026-07-17)** — docs arrived at `developer.telcell.am`. Implemented as `TelcellGateway` (WEB invoice flow: browser POSTs to `telcellmoney.am/invoices`, Telcell POSTs a signed PAID/REJECTED callback). Registered + seeded active, storefront + checkout wired, 26 tests. See the Telcell section in `CLAUDE.md`. **EasyPay is still blocked** — no public docs for it. |
| 2 | **CSV bulk product import** | Dropped by owner. |

---

## ✅ Weekly commission billing (DONE, 2026-07-17)

Not part of P0–P3 — a follow-up once Telcell shipped. The commission engine (P0) only
*accrues* a ledger balance; nothing turned it into money the platform actually collects.

| Delivered | Where |
|-----------|-------|
| Period-based `commission_invoices` table (ledger stays append-only) | `database/migrations/2026_07_17_000001_*` |
| Weekly generation command + schedule (Mondays 08:00) | `app/Console/Commands/SendCommissionInvoices.php`, `routes/console.php` |
| Seller email + Pay button | `CommissionInvoiceNotification`, `/seller/invoices` |
| Online collection via the **platform's own** Telcell merchant account (reuses `TelcellGateway`) | `config/telcell.php`, `Seller/CommissionInvoiceController::pay`, `InvoicePaymentController::callback` |
| Admin oversight (list, summary, void) | `/admin/invoices` |

Design notes in `CLAUDE.md` → "Commission billing".

---

## ✅ Idram payments (DONE, 2026-08-04)

Idram had shipped since the first build but was written from a written spec rather than
Idram's own documentation, and **could never have completed a payment**: it invented a
request checksum and `EDP_SUCCESS_URL`/`EDP_FAILURE_URL` fields that don't exist, posted to
the wrong host, computed the confirmation checksum from the wrong fields in the wrong order,
and ignored the mandatory precheck entirely. Separately, the seller UI called
`/seller/payment-gateways`, a route that has never existed — so nobody could enter credentials
even in principle. Rewritten against the official merchant-interface PDF.

| Delivered | Where |
|-----------|-------|
| Wallet form + card iframe, correct fields and hosts | `app/Services/PaymentGateway/Gateways/IdramGateway.php` |
| Mandatory unsigned precheck, read-only, `OK`-gated | `SupportsPrecheck`, `Store\PaymentController::handlePrecheck` |
| Correct confirmation checksum, bound to our own account | `IdramGateway::verify` |
| Card iframe checkout + order polling | `components/store/CardPaymentFrame.tsx` |
| SUCCESS_URL has no order id → sessionStorage handoff | `lib/payment.ts`, `PendingOrderRedirect.tsx` |
| Seller config UI repaired + shows the 3 URLs to register | `/seller/payments`, `AvailableGatewayResource` |
| Platform Idram account for commission invoices | `config/idram.php`, `PlatformGatewayCredentials` |
| Live row repaired (deploys never seed) | `2026_08_04_000001_fix_idram_gateway_required_fields` |

Protocol details and the traps in `CLAUDE.md` → "Payment gateways" → Idram. **The load-bearing
rule:** the precheck is unsigned, so its handler stays strictly read-only, and `EDP_BILL_NO` is
the order UUID specifically so that unauthenticated endpoint can't be used to enumerate orders.

---

## Known open issues (not in any phase)

| Issue | Severity | Detail |
|-------|----------|--------|
| ~~Registry key ≠ seeder name for bank stubs~~ | ✅ Fixed 2026-08-04 | Registry keys aligned to `ineco` / `converse`, and both stubs now implement `UnimplementedGateway` so the admin panel refuses to activate them at all. A test asserts every seeded name resolves in the registry. |
| **`telcell` row missing in production** | 🔴 Open | `PaymentGatewaySeeder` defines it but deploys only migrate, so the live DB has only `idram`, `ineco`, `converse`. **Telcell checkout has never worked on this server** — no seller can enable it and it never appears in a storefront. Commission-invoice payment via Telcell is unaffected (reads `config/telcell.php`, not the DB row). Fix is a data migration adding the row, same pattern as `2026_08_04_000001`. |
| Unauth API returns 500 without `Accept` | 🟢 Cosmetic | With `Accept: application/json` it correctly returns 401. Bare requests hit a missing `login` named route. Affects every admin endpoint equally; no real client sends no Accept. |
| **Memory pressure** | 🟠 Watch | 3.8 GB box with **swap already ~1.5/2 GB used**. `web` runs at ~114/128 MB. Dropping `mongodb` + `meilisearch` on 2026-07-26 gave back ~40 MB live and 384 MB of `mem_limit` commitment. If things get unstable, this is still the first place to look. |
| Admin sidebar says "Yerevan Digital" | 🟢 Cosmetic | `components/admin/AdminSidebar.tsx`. The 2026-07-14 rebrand was Yerevan Digital → Yerevan Digital; unclear if this internal label was intentional. |
| ~~Seller payments page fetches `/seller/payment-gateways`~~ | ✅ Fixed 2026-08-04 | Confirmed real: the page and its modal both called routes that never existed, so **no seller could configure any gateway**. Repointed to `/seller/payments/{available,configure}` with the correct payload shape. |

---

## Decisions already made (don't re-litigate)

| Decision | Rationale |
|----------|-----------|
| Commission lives in **Laravel, not Go** | `admin-reports` is the read side of a CQRS split and is deliberately read-only. Commission is a write that must be ACID with the order. Go would need an outbox + reconciliation for zero benefit. |
| Commission base = `subtotal - discount` | Shipping and tax are pass-through. Revisit only if the business model changes. |
| Default commission **5%** | `config/commission.php` / `COMMISSION_DEFAULT_RATE`. Picked to ship; per-store override exists. Owner should confirm. |
| A store with **no zones ships free** | Enabling shipping must never silently start charging existing stores. |
| Coupon codes unique **per store** | Two stores may both run `SALE10`. |

---

## Picking this up in a new session

1. Read `CLAUDE.md` — deploy workflow, architecture, recurring pitfalls. **The deploy rules there are strict** (never run docker manually; never wait for a deploy).
2. Read this file for phase status.
3. Confirm reality before trusting either — both drift:
   ```bash
   git log --oneline -5
   curl -s https://api.yerevan.digital/api/v1/stats
   docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
   ```
4. **Phase scope is all-or-nothing.** "Do P2" means every row of P2 — backend, UI, tests — not a backend slice with the UI flagged as a gap. Raise scope objections *before* starting.

### Verification bar used for P0/P1
Match it. Both phases shipped with:
- Full API suite green (`./vendor/bin/phpunit`) — dev deps are ephemeral, reinstall after any container restart
- `tsc --noEmit` + `next build` clean before pushing (the deploy runs `next build`; a type error breaks the deploy)
- Migrations run against a **scratch MySQL database** first — tests use SQLite and will not catch MySQL-only syntax
- Live smoke test after deploy (`scheduler` up, tables created, endpoints answering)

### Traps that already bit once
- `scripts/deploy.sh` **enumerates services** to build/start. Add any new container to **both** lines or it silently never runs. (Cost the scheduler once.)
- **Never write a payment gateway without the provider's real API docs.** A guessed protocol looks complete and passes self-written tests.
- `/etc/nginx/sites-enabled/` is `include`d wholesale — never leave a `.bak` there or nginx loads it as a duplicate config.
- `Store` route key is **slug**, not id.
- Both checkout templates (`_shared` and `spark`) need storefront changes — spark does not re-export `_shared`.
- Laravel factory `create()` overrides beat state closures.
