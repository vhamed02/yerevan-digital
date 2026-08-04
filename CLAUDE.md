# Yerevan Digital — Claude Code Project Memory

**Roadmap & phase status: [`docs/ROADMAP.md`](docs/ROADMAP.md)** — what's done (P0, P1), what's
next (P2, P3), known open bugs, and decisions not to re-litigate. Read it before starting
feature work. This file is the *how*; that one is the *what*.

## Deploy workflow (CRITICAL)

**Never run docker commands manually.** All changes must be committed and pushed to git.

```bash
# Stage and commit
git add <files>
git commit -m "Your message"

# Push (root has the SSH key; there is no deploy user)
git -C /home/yerevan-digital push origin master
```

The GitHub webhook triggers `scripts/deploy.sh` automatically, which:
- Pulls latest, rebuilds `web` and `api` containers
- Runs `optimize:clear`, `cache:clear`, `migrate --force`
- Reloads nginx

**Never wait for the deploy to finish.** After pushing, only confirm the webhook triggered — the new commit hash appears in `/var/log/yerevan-digital/deploy.log` — then move on. Do not poll the live site or watch the build.

Webhook plumbing: GitHub (`vhamed02/yerevan-digital`) → `webhook.service` (adnanh/webhook) on port 9001, hooks loaded from **`/etc/webhook.conf`** (NOT the repo's `scripts/hooks.json`, which is only a template and is kept `--assume-unchanged`). Verify deliveries with `journalctl -u webhook -n 20`.

A matched-but-failed hook still returns HTTP 200 to GitHub, so GitHub reports the webhook as healthy while nothing deploys. If pushes stop deploying, check for `error in exec` in the webhook log before suspecting GitHub. (This is exactly what happened after the rebrand: `/etc/webhook.conf` kept the pre-rename `/home/vendorex` path and auto-deploy was silently dead from 2026-06-22 to 2026-07-15.)

Git identity: `user.name="vhamed02"`, `user.email=vhamed02@gmail.com`  
`gh` CLI is **not installed** on this server.

**Do not mention "Claude" in commit messages.**

---

## Infrastructure

- **Server:** Ubuntu 24, hostname `yerevan.digital`, repo at `/home/yerevan-digital` (the old `/home/deploy/vendora` and `/home/vendorex` paths are gone; `/home/vendorex` still holds an unused `docker/`+`services/` fragment from the rename)
- **Domains:** `yerevan.digital` (frontend) / `api.yerevan.digital` (API), both Cloudflare-proxied; TLS terminates at Cloudflare (nginx listens on 80 only). The old `radif.org` zone is stale (522) — don't use it. `/etc/hosts` maps `yerevan.digital` to 127.0.1.1, so server-local curl tests need `--resolve` or `http://localhost` + Host header.
- **Stack:** Laravel 13 / PHP 8.5 API + Next.js 16.2.6 frontend, MySQL 8, Redis 7, Docker Compose
- **Networks:** `yerevan-digital-backend` (api, mysql, redis), `yerevan-digital-frontend` (nginx, web, api)
- **Workers:** `queue` runs `queue:work` (emails/notifications) and `scheduler` runs `schedule:work`. `QUEUE_CONNECTION=redis`, so if `queue` is down, mail silently never sends; anything registered in `routes/console.php` needs `scheduler` up.
- **SSR API path:** Next.js server-side calls `http://nginx:8080/api/v1/...` — nginx listens on 8080 and proxies to PHP-FPM at `api:9000`
- **Client-side API path:** `https://api.yerevan.digital/api/v1/...`
- **Base images are digest-pinned** (all Dockerfiles): unpinned tags re-resolve from the registry every build, and upstream releases silently bust the whole layer cache (15-min PHP extension recompiles). To upgrade a base image, change the digest deliberately and expect one slow rebuild.

---

## Recurring bugs / known pitfalls

### 1. Double-envelope bug (frontend — both SSR and client)

**`server-api.ts`** `unwrap()` strips the `{ success, data }` envelope for SSR calls.  
**`lib/api.ts`** response interceptor does the same for client-side `api.post/get` calls.

Both mean `response.data` is already the inner payload — never add an extra `.data`.

```ts
// CORRECT — server-side
const product = await serverAuthGet<SellerProduct>(`/seller/products/${uuid}`)

// CORRECT — client-side
const res = await api.post<{ uuid: string }>('/store/x/checkout', body)
const uuid = res.data.uuid          // res.data IS the payload

// WRONG in both cases — .data will be undefined
const res = await api.post<{ data: { uuid: string } }>('/store/x/checkout', body)
const uuid = res.data.data.uuid     // data.data is undefined
```

Paginated responses return `{ data: T[], meta: {...} }` directly — type it as such.

### 2. Redis serialization bug (backend)

Eloquent models and Collections cached in Redis become `__PHP_Incomplete_Class` on unserialize → broken API responses.

**Rule:** Only cache scalar values or plain PHP arrays:
```php
// CORRECT
->values()->all()        // Collection → plain array
->resolve()              // Resource → plain array
->value('id')            // single scalar

// WRONG — never cache Eloquent models or Collections directly
Cache::put('key', $store);
Cache::put('key', $collection);
```

Fixed instances: `ResolveStore` middleware (caches store ID only), `StoreController::categories()`, `PublicStoreController::featured()`.

### 3. Spatie roles vs `role` column

`EnsureUserIsSeller` middleware uses `$user->hasRole('seller')` (Spatie permission table), **not** the `role` enum column on `users`.

**Rule:** When creating sellers (admin or seeder), always call both:
```php
$user->update(['role' => UserRole::Seller]);
$user->assignRole('seller');
```

Missing `assignRole()` causes 403 on all seller API calls even though `users.role = 'seller'`.

### 4. Order status transitions

`OrderStatus::allowedTransitions()` (in `app/Enums/OrderStatus.php`, **not** the controller) governs valid status changes:
```php
'pending'    => ['paid', 'processing', 'cancelled'],
'paid'       => ['processing', 'cancelled'],
'processing' => ['shipped', 'cancelled'],
'shipped'    => ['delivered'],
'delivered'  => [],
'cancelled'  => [],
'refunded'   => [],
```
`pending → processing` is intentionally allowed (COD and manual payment flows).

### 5. `OrderItem` API shape

`OrderItemResource` returns flat fields — there is no nested `product` object:
```ts
interface OrderItem {
  id: number
  product_name: MultiLang   // { hy, en }
  variant_name?: MultiLang
  sku?: string
  quantity: number
  unit_price: number
  total_price: number
}
```

### 6. SQLite test compatibility (raw SQL)

Tests run against SQLite in-memory (`phpunit.xml`). MySQL-specific functions crash tests:

```php
// WRONG — MySQL only, breaks tests
->selectRaw('SUM(CASE WHEN MONTH(created_at) = ? THEN ...')
->selectRaw('... DATE(created_at) = CURDATE() ...')

// CORRECT — database-agnostic
->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
->whereDate('created_at', today())
// Group by date in PHP after fetching, or use substr($row->created_at, 0, 10)
```

### 7. Running tests (no local PHP)

The production api container uses `--no-dev` so PHPUnit isn't installed. Workflow:
```bash
# Install dev deps in running container (ephemeral — lost on restart)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api composer install --no-interaction

# Copy changed source files into container before running
CONTAINER=$(docker compose -f docker-compose.yml -f docker-compose.prod.yml ps -q api)
docker cp services/api/path/to/File.php "$CONTAINER":/var/www/html/path/to/File.php

# Run tests
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api ./vendor/bin/phpunit --colors=never

# Web tests (no node locally either)
docker run --rm -v /home/deploy/vendora/services/web:/app -w /app node:22-alpine sh -c "npm install --silent && npm test"
```

### 8. Auth store `updateStore()` / stale localStorage

`sellerStore` is persisted in localStorage via Zustand. `updateStore()` must handle a `null` starting state:
```ts
updateStore: (partial) =>
  set((state) => ({
    sellerStore: { ...(state.sellerStore ?? {}), ...partial } as Store,
  })),
```

`SellerLayoutClient` verifies localStorage against the API on load to self-heal stale state. Pages render `null` until `storeChecked` is true, preventing premature wizard display.

---

## Commission engine (added 2026-07-15)

How the platform actually earns money — the pricing page promises a per-sale commission.

- **Ledger:** `commissions` is **append-only**. Never update or delete a row; undo by writing a `reversal`. A store's balance is `SUM(amount)` (accruals positive, reversals negative). `unique(order_id, type)` is the idempotency guard — a replayed gateway callback cannot double-charge.
- **Atomicity (the whole design):** `CommissionService::accrue()` runs *inside* the same `DB::transaction` as the order flipping to paid, in `HandlePaymentSuccessAction`. An order can never be paid without its commission landing with it. **Never** move this to a queued listener or a separate service — that trades the ACID guarantee for reconciliation drift on money. (Go's `admin-reports` is the read side of a CQRS split; Laravel keeps all writes.)
- **Reversal:** `Seller/OrderController::updateStatus` reverses on `cancelled`/`refunded`. Nothing transitions *to* `refunded` today, so `cancelled` is the live path.
- **Base:** `subtotal - discount`, clamped at 0 — shipping and tax are pass-through and excluded. Revisit when shipping zones land.
- **Rate:** `stores.commission_rate` → `commission_rate` platform setting (`store_settings` with `store_id IS NULL`) → `config/commission.php` (`COMMISSION_DEFAULT_RATE`, currently **5%**). Rate + base are snapshotted per row, so changing a rate never rewrites history.
- **Money maths:** bcmath on decimal strings, rounded **half-up**. Never use floats — `100.10 * 0.05` is exactly `5.005`, which binary floats round the wrong way.
- **Admin:** `GET /admin/commissions`, `GET /admin/commissions/summary`, `PATCH /admin/stores/{store}/commission-rate` (route key is the **slug**, not the id). Sending `commission_rate: null` clears the override.
- **Purge:** `PurgeDemoData` must delete `commissions` before `orders` — the FK is `restrictOnDelete`.

---

## Coupons & shipping (added 2026-07-15)

Both are applied in `CreateOrderAction`, inside the order transaction. Order maths is
`total = subtotal - discount + shipping_cost + tax`.

- **Money:** `App\Support\Money` is the single home for decimal arithmetic (bcmath, round half-up). `CommissionService`, `CouponService` and `ShippingService` all go through it. **Never do money maths with floats** — `0.05 * 100.10` is exactly 5.005 and floats round it the wrong way. The item-pricing loop in `CreateOrderAction` still uses floats (pre-existing); everything after it is exact.
- **Coupons:** codes are uppercased on save and unique **per store** (two stores can both use `SALE10`). `StoreCouponRequest::prepareForValidation()` uppercases before the unique rule, or lowercase input passes validation and then trips the DB constraint. Checkout locks the row (`findByCodeForUpdate`) so concurrent orders can't both beat `usage_limit`. Discounts only ever come off the subtotal, never shipping — which keeps the commission base honest.
- **Shipping:** first active zone listing the checkout city wins, else the store's `is_default` fallback zone, else free. **A store with no zones ships free**, so enabling this never silently starts charging. At most one fallback per store — the controller demotes the previous one.
- **Storefront:** `useCheckoutTotals` + `CouponField` are shared by both checkout templates (`_shared` and `spark` — spark does *not* re-export `_shared`, so changes must land in both). Cart-side coupon/shipping figures are advisory; checkout re-resolves both server-side and that's what's charged.
- **Public `coupons/preview` is throttled** (`throttle:coupon`) — an unauthenticated code lookup is a code-enumeration target.

## Backups (added 2026-07-16)

`scripts/backup.sh`, run nightly at 03:20 by the `yerevan-digital-backup.timer` systemd timer
(install/reinstall with `scripts/install-backup-timer.sh`; the unit files are **not** in this
repo). Logs to `/var/log/yerevan-digital/backup.log`, writes to `/var/backups/yerevan-digital`, keeps 7 days.

Backs up only what can't be rebuilt: **MySQL** (`--single-transaction`, gzipped) and the
**storage volume** (uploaded images). Redis is cache/queue. The script verifies the gzip and
greps for mysqldump's `Dump completed` marker, because a truncated dump that looks like a
backup is worse than none; it also refuses to run below 2 GB free (the box sits at ~80% full).

**Restore:**
```bash
zcat /var/backups/yerevan-digital/mysql-YYYYmmdd-HHMMSS.sql.gz | \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T mysql \
  sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```
Verified end-to-end on 2026-07-16 by restoring into a scratch database (37 tables, 38
migrations). **Backups are local only** — a disk failure loses them with the site. Offsite copy
is still an open decision.

## Payment gateways (Telcell added 2026-07-17, Idram rewritten 2026-08-04)

- **Architecture:** each gateway is a `PaymentGatewayInterface` impl under `app/Services/PaymentGateway/Gateways/`, registered by key in `PaymentServiceProvider`, and seeded as a row in `payment_gateways` (`PaymentGatewaySeeder`). **The DB `name` must equal the registry key** — `Store\PaymentController` looks the store's gateway up by `name` and then fetches that same key from the registry. Sellers store per-store credentials on `store_payment_gateways`; the storefront (`StoreInfoResource`) exposes only enabled gateway names, and both checkout templates render them.
- **`extractOrderReference($callbackData)`** on the interface returns our order UUID from a raw callback — each gateway names/encodes it differently (Idram `EDP_BILL_NO`; Telcell base64 `issuer_id`), so `Store\PaymentController::callback` is gateway-agnostic. Stubs return `null`.
- **`required_fields` format:** the seller config UI (`GatewayConfigModal`) and `configure()`'s validation both read the **DB column**, which must be `[{key, label_hy, label_en}]`. A flat `['account_id', ...]` array is the legacy shape — it renders *zero* inputs, so the gateway silently becomes unconfigurable. Idram carried that shape until 2026-08-04; `ineco` and `converse` still do (both inactive). **Seeder edits do not reach production** — `scripts/deploy.sh` runs `migrate --force` and never seeds, so a row fix needs a data migration (see `2026_08_04_000001_fix_idram_gateway_required_fields`).
- **Precheck (`SupportsPrecheck`):** a gateway may ask "is this bill real?" *before* moving money. Both callback controllers branch on it before any state change. The precheck is **unsigned**, so its handler must stay strictly read-only and answer a literal `OK` only on a full match (order pending + recipient account + amount). See the Idram entry below.
- **Placeholders (`UnimplementedGateway`):** `ineco` and `converse` have been stubs since the first payment commit — every method reports "coming soon" or throws. They implement this marker, and `Admin\PaymentGatewayController::toggle` **refuses to activate** anything carrying it (or any DB name with no registry key at all). Migration `2026_08_04_000002` pins both `is_active = 0`. To bring one live: get the provider's real docs, implement the protocol, drop the marker, then activate. Their registry keys were `innecobank` / `converse_bank` against DB names `ineco` / `converse` until 2026-08-04 — activating either would have thrown; `AdminPaymentGatewayTest` now asserts every seeded name resolves in the registry.
- **Telcell (WEB invoice flow):** live `initiate()` returns `redirectUrl = https://telcellmoney.am/invoices` plus `rawResponse` form fields; the frontend `redirectToGateway()` (`lib/payment.ts`) **POSTs** them (a plain GET redirect won't work — this also fixed Idram live mode). Request sig: `md5(shop_key + issuer + '֏' + price + product + issuer_id + valid_days)`; `product`/`issuer_id` are base64. Callback sig: `md5(shop_key + invoice + issuer_id + payment_id + currency + sum + time + status)`; `status` is `PAID`/`REJECTED`. Amounts are **whole AMD** (no minor unit). Callback acks with plain-text `OK` 200; a bad signature → 400, a correctly-signed `REJECTED` → 200 (don't make Telcell retry a real rejection). Credentials: `issuer` (shop email), `shop_key` (secret), `valid_days`. **Callback URL is configured in the Telcell merchant panel**, not passed per-invoice.

### Idram (rewritten 2026-08-04 from the official merchant-interface PDF)

The pre-2026-08-04 implementation was written from a spec, not from Idram's docs, and was
wrong on nearly every point — invented request checksum, invented `EDP_SUCCESS_URL` /
`EDP_FAILURE_URL` fields, wrong host, wrong confirmation checksum, and **no precheck handling
at all**. It could never have completed a payment. Don't restore any of it.

- **Two surfaces, one merchant account:** the wallet form (browser **POSTs** to
  `https://banking.idram.am/Payment/GetPayment`) and the VISA/MasterCard iframe
  (`https://money.idram.am/{AM|RU|EN}/ccepayMerchant.aspx?EDP_REC_ACCOUNT&EDP_AMOUNT&EDP_BILL_NO`).
  Checkout offers them as `idram` and `idram_card`; `Store\PaymentController::resolveGateway()`
  maps `idram_card` back onto the `idram` gateway + credentials via `PaymentRequest::$options`.
- **The request is unsigned.** Idram authenticates the merchant by `EDP_REC_ACCOUNT` alone.
  Fields are exactly `EDP_LANGUAGE` (AM/RU/EN), `EDP_REC_ACCOUNT`, `EDP_DESCRIPTION`,
  `EDP_AMOUNT`, `EDP_BILL_NO`, optional `EDP_EMAIL`. Nothing else is part of the protocol.
- **SUCCESS_URL / FAIL_URL / RESULT_URL are fixed per merchant by Idram staff** at agreement
  time — they are *not* sent per payment. Consequences that bite:
  - The seller must register them; `/seller/payments` shows the three exact URLs with copy
    buttons (`AvailableGatewayResource::integration_urls`, custom-domain aware).
  - **SUCCESS_URL cannot carry `?order=<uuid>`.** Checkout stashes the uuid in `sessionStorage`
    (`rememberPendingOrder`) and `PendingOrderRedirect` puts it back on the confirmation page.
- **Precheck is mandatory and unsigned.** Idram POSTs `EDP_PRECHECK=YES` with bill/recipient/
  amount before debiting. Answer the literal `OK` or the payment is abandoned and the customer
  is bounced to FAIL_URL. `handlePrecheck()` verifies pending order + recipient + amount
  (`Money::compare`, so `15000` and `15000.00` both match) and **never mutates anything**.
  Enumeration is contained by `EDP_BILL_NO` being the order **UUID** — don't switch it to
  `order_number` or the id, which are guessable on an unauthenticated endpoint.
- **Confirmation checksum:** `strtoupper(md5(rec : amount : SECRET_KEY : bill : payer : trans_id : trans_date))`,
  compared with `hash_equals` case-insensitively. It is built from **our configured**
  `rec_account`, not the payload's, so a callback naming another merchant can never validate.
  Bad signature → `400`; success → plain-text `OK` 200.
- **Credentials:** `rec_account` (Idram ID) + `secret_key`, optional `email`. Legacy `edp_id` /
  `account_id` keys are still accepted on read (`recipientFromCredentials`) so pre-rewrite
  configs keep working. Idram publishes **no sandbox host** — incomplete credentials fall back
  to the platform's own simulated checkout.
- **Card iframe completion:** the frame is cross-origin and unreadable, so `CardPaymentFrame`
  polls `GET /store/{slug}/orders/{uuid}` (hence `payment_status` on `PublicOrderResource`)
  until the server-side callback lands, then forwards to the confirmation page.

## Commission billing (added 2026-07-17)

Telcell payments land directly in each seller's own wallet, so the platform never withholds
its cut at sale time — `commissions` only *accrues* a signed ledger row. This feature turns
that ledger balance into money the platform actually collects, weekly.

- **Why a separate table:** the `commissions` ledger is append-only and has no
  paid/settled column (see "Commission engine" above) — billing state lives on a new
  **period-based** `commission_invoices` table instead of a flag on the ledger.
  `unique(store_id, period_start)` is the idempotency guard: re-running a period for a store
  that already has an invoice creates nothing and sends nothing.
- **Generation:** `CommissionInvoiceService::generateForPeriod()` sums each store's signed
  `commissions.amount` over `[period_start, period_end)` via `Money` (never SQL `SUM` — see
  "Money maths" above) and snapshots the net as a `commission_invoices` row when it's `> 0`.
  A net `<= 0` (e.g. reversals outweigh accruals) creates nothing.
- **Schedule:** `invoices:commission` runs Mondays 08:00 (`routes/console.php`, picked up by
  the `scheduler` container automatically) and bills the **previous complete ISO week**.
  `--period-start=YYYY-MM-DD` overrides the window for backfill; `--store=<slug>` limits
  generation/mail to one store; `--dry-run` computes and prints without persisting or
  emailing (it runs the real path inside a transaction and rolls it back).
- **Email:** `CommissionInvoiceNotification` (queued on `emails`) links to `/seller/invoices`
  — no PDF, matching the rest of the notification system.
- **Collection is online, via the platform's own Idram *and* Telcell merchant accounts** —
  money flows seller → platform, the reverse direction from checkout. Credentials come from
  `config/idram.php` (`IDRAM_PLATFORM_REC_ACCOUNT` / `_SECRET_KEY` / `_EMAIL`) and
  `config/telcell.php` (`TELCELL_PLATFORM_ISSUER` / `_SHOP_KEY` / `_VALID_DAYS`), **not** from
  a store's `store_payment_gateways` row.
- **`App\Support\PlatformGatewayCredentials`** is the single arbiter of which platform accounts
  are live. It tests the **required keys per gateway**, never truthiness of the whole config
  array — both gateways have optional settings with non-empty defaults (Telcell `valid_days`,
  Idram `email`), so an array test reports an unconfigured account as live. With *no* account
  configured it offers every gateway and each falls back to the internal sandbox, so dev can
  still exercise the flow.
- **Seller pay flow:** `Seller\CommissionInvoiceController::pay()` takes a `gateway` body param
  (defaults to `telcell` for older clients), validates it against
  `PlatformGatewayCredentials::available()`, and reuses the registry gateway as-is — no
  invoice-specific gateway code. Only a `pending` invoice is payable
  (`InvoiceStatus::allowedTransitions()`: `pending → [paid, void]`).
  `GET /seller/invoices/payment-methods` feeds the buttons — it **must stay declared before
  `invoices/{uuid}`** or Laravel matches it as a uuid.
- **Callback:** `POST /api/v1/invoices/callback/{gateway}` (public, outside any auth group,
  `whereIn` idram|telcell) → `InvoicePaymentController::callback`, structured exactly like
  `Store\PaymentController` — Idram precheck handled first, then plain-text `OK` 200 on success
  or idempotent replay, `Invalid checksum` 400 on a bad signature, `OK` 200 on a
  correctly-signed rejection. The Idram bill number is the **invoice uuid**.
- **Admin oversight:** `GET /admin/invoices`, `GET /admin/invoices/summary`,
  `POST /admin/invoices/{uuid}/void` (guards `pending` only).
- **Purge ordering:** `PurgeDemoData` deletes `commission_invoices` before `stores` — the FK
  is `restrictOnDelete`, same reason `commissions` is deleted before `orders`.

## Custom domains & search (added 2026-07-15)

- **Custom domains:** full design in [`docs/custom-domains.md`](docs/custom-domains.md). Short version: `proxy.ts` resolves the Host via `GET /domains/resolve` and rewrites `/` → `/store/{slug}`; a domain only routes once its TXT record is verified **and** the store is active. **TLS is the seller's own Cloudflare** — this box has no certs and no certbot, and nginx listens on :80 only. The host nginx catch-all that makes this work lives in `/etc/nginx/sites-available/vendora`, which is **not in this repo and not restored by a deploy** (backup: `/root/vendora.bak.*`).
- **Search:** plain SQL `LIKE` in `ProductRepository::paginatePublicByStore()`, matching `name->hy`, `name->en`, `name->ru` and `sku`, composed with every other filter and the sort. **Meilisearch and Scout were removed on 2026-07-26** — with no live sellers, a search container and its index were not worth ~190 MB of a 3.7 GB box. The engine bought typo tolerance and relevance ranking, not extra coverage: all three languages are searched either way. Reintroduce Scout only when catalogue size (or seller complaints about typo matching) justifies the container.
- **Wishlist:** `wishlist_items`, per-account and login-gated (`/customer/wishlist`). Before this the spark `ProductCard` heart was `useState` only and saved nothing.

## Seller analytics

`Order::scopeRevenueCounted()` defines revenue once: **paid, and not cancelled or refunded** — the same set commission accrues/reverses over. Use it for anything money-shaped; before 2026-07-15 the dashboard summed *all* orders, counting pending and cancelled ones as revenue.

`topProductsByStore()` groups by `product_id` only and resolves names in PHP — grouping on the translatable JSON name column isn't portable across MySQL/SQLite. It returns the product **uuid** because seller product routes key on uuid, not id. `conversion_rate` is paid orders ÷ product views (directional; there's no session tracking).

---

## Demo seeders

`database/seeders/DemoSeeder.php` — 6 Armenian stores, 50+ products, ~180 orders.

Seller accounts (all password `Password1!`):
- hayk@yerevan-tech.am
- nune@armfashion.am
- gor@ararat-foods.am
- mariam@sevan-beauty.am
- armen@artisan-am.am
- tigran@sportmax.am

Run after deploy:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api php artisan db:seed --class=DemoSeeder
```

**Production was purged of all demo/mock data on 2026-06-10** — do not reseed DemoSeeder there. Maintenance commands:
- `php artisan demo:purge [--dry-run] [--force] [--user=email]` — hard-deletes demo sellers + dependents (never touches super admins)
- `php artisan admin:create {email} [--name=] [--password=]` — create/promote a super admin (generates a strong password when omitted)

---

## Blog system (added 2026-06-10)

Trilingual (hy/en/ru) blog for SEO. One shared English-canonical slug per post; display falls back locale→en→hy via `pickLang`.

- **Backend:** `posts` table, `Post` model + `PostStatus` enum, `PostRepository`, admin CRUD at `/api/v1/admin/posts` (slug auto-generated via `SlugService`), public `/api/v1/posts[/{slug}]` (published-only). Public payloads cached in Redis as plain arrays with a version key (`blog:posts:ver`); `PostObserver` flushes on save/delete.
- **Admin UI:** `/admin/blog` — `BlogAdminClient` (list) + `PostEditorClient` (3-lang TipTap editor, cover via `media/upload`, per-language SEO fields, draft/publish).
- **Public:** `(website)/blog` + `blog/[slug]` — hreflang + canonical, OG article, `BlogPosting` + `BreadcrumbList` JSON-LD, localized dates (`lib/blog.ts`), reading time. RSS at `/blog/rss.xml?lang=hy|en|ru`. Blog URLs in `sitemap.ts` with per-locale alternates. `LatestPosts` section on the homepage (hidden when no posts).
- **ISR:** pages cache API responses ~5 min — new/edited posts appear on the live site within that window.

---

## Architecture notes

- **Storefront template config lives in MySQL** (`store_template_configs`, one JSON row per store, FK cascade). It was a MongoDB collection until 2026-07-26; the `mongodb` container, connection, PHP extension and `mongodb/laravel-mongodb` are all gone. `StoreTemplateConfigRepository` is the only way in — don't reach for the model directly.
- **Each seller has exactly one store.** The seller middleware, dashboard, and all seller API routes are scoped to a single store per user. Multi-store would require a significant refactor.
- **Seller layout:** `SellerLayoutClient` renders `{children}` directly inside `min-h-screen` (no `<main>` wrapper). Each seller page/component owns its own `mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8` container. `StoreDesignClient` goes full-bleed (no container, no negative margins needed).
- **Product slug check endpoint:** `GET /seller/products/check-slug?slug=x&exclude=uuid` — must come before `products/{uuid}` in routes or Laravel matches it as a UUID.

## Key file locations

| What | Where |
|------|-------|
| API routes | `services/api/routes/api.php` |
| Seller middleware | `services/api/app/Http/Middleware/EnsureUserIsSeller.php` |
| Seller DashboardController | `services/api/app/Http/Controllers/Seller/DashboardController.php` |
| Seller OrderController | `services/api/app/Http/Controllers/Seller/OrderController.php` |
| Frontend types | `services/web/src/types/index.ts` |
| Server-side API client | `services/web/src/lib/server-api.ts` |
| Auth Zustand store | `services/web/src/stores/auth.store.ts` |
| Seller layout client | `services/web/src/components/seller/SellerLayoutClient.tsx` |
| SearchableSelect UI | `services/web/src/components/ui/SearchableSelect.tsx` |
| Deploy script | `scripts/deploy.sh` |
| Demo seeder | `services/api/database/seeders/DemoSeeder.php` |
