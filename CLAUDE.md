# Vendora — Claude Code Project Memory

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

**Never wait for the deploy to finish.** After pushing, only confirm the webhook triggered — the new commit hash appears in `/var/log/vendora/deploy.log` — then move on. Do not poll the live site or watch the build.

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
- **Networks:** `vendora-backend` (api, mysql, mongodb, redis), `vendora-frontend` (nginx, web, api)
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

## Custom domains & search (added 2026-07-15)

- **Custom domains:** full design in [`docs/custom-domains.md`](docs/custom-domains.md). Short version: `proxy.ts` resolves the Host via `GET /domains/resolve` and rewrites `/` → `/store/{slug}`; a domain only routes once its TXT record is verified **and** the store is active. **TLS is the seller's own Cloudflare** — this box has no certs and no certbot, and nginx listens on :80 only. The host nginx catch-all that makes this work lives in `/etc/nginx/sites-available/vendora`, which is **not in this repo and not restored by a deploy** (backup: `/root/vendora.bak.*`).
- **Search:** Laravel Scout + Meilisearch (`meilisearch` container, `SCOUT_DRIVER=meilisearch`, `SCOUT_QUEUE=true` so indexing rides the existing `queue` worker). `Product::toSearchableArray()` indexes `name_hy/name_en/name_ru` + `sku` — **the old SQL `LIKE` search only looked at `name->en` and `name->hy`, so Russian was unfindable**. `ProductRepository::searchProductIds()` returns ids and lets SQL apply every other filter and the sort; it returns `null` (→ SQL `LIKE` fallback) when the driver isn't meilisearch *or* Meilisearch is unreachable, so a search outage degrades instead of 500ing. Filterable attributes are declared in `config/scout.php` and applied by `scout:sync-index-settings` (runs on deploy) — Meilisearch **rejects** a filter on an undeclared attribute. Tests force `SCOUT_DRIVER=null`.
- **Backfilling the index:** `php artisan scout:import "App\Models\Product"`. Not in the deploy — it's a one-off after enabling search or restoring the Meilisearch volume.
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
