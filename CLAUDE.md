# Vendora — Claude Code Project Memory

## Deploy workflow (CRITICAL)

**Never run docker commands manually.** All changes must be committed and pushed to git.

```bash
# Stage and commit
git add <files>
git commit -m "Your message"

# Push (must use deploy user — root lacks SSH key)
sudo -u deploy git -C /home/deploy/vendora push origin main
```

The GitHub webhook triggers `scripts/deploy.sh` automatically, which:
- Pulls latest, rebuilds `web` and `api` containers
- Runs `optimize:clear`, `cache:clear`, `migrate --force`
- Reloads nginx

**Never wait for the deploy to finish.** After pushing, only confirm the webhook triggered — the new commit hash appears in `/var/log/vendora/deploy.log` — then move on. Do not poll the live site or watch the build.

If the webhook doesn't fire (GitHub occasionally skips a delivery — verify with the first command), re-send a push event:
```bash
gh api repos/vhamed02/vendora/hooks/624681417/deliveries --jq '.[:3][].delivered_at'
gh api -X POST repos/vhamed02/vendora/hooks/624681417/tests
```

Git identity: `user.name="Vendora Dev"`, `user.email=vhamed02@gmail.com`  
Deploy SSH key: `/home/deploy/.ssh/github_deploy`

**Do not mention "Claude" in commit messages.**

---

## Infrastructure

- **Server:** Ubuntu 24, hostname `vendorex`, repo at `/home/deploy/vendora`
- **Domains:** `vendorex.shop` (frontend) / `api.vendorex.shop` (API), both Cloudflare-proxied; TLS terminates at Cloudflare (nginx listens on 80 only). The old `radif.org` zone is stale (522) — don't use it. `/etc/hosts` maps `vendorex.shop` to 127.0.1.1, so server-local curl tests need `--resolve` or `http://localhost` + Host header.
- **Stack:** Laravel 13 / PHP 8.5 API + Next.js 16.2.6 frontend, MySQL 8, Redis 7, Docker Compose
- **Networks:** `vendora-backend` (api, mysql, mongodb, redis), `vendora-frontend` (nginx, web, api)
- **SSR API path:** Next.js server-side calls `http://nginx:8080/api/v1/...` — nginx listens on 8080 and proxies to PHP-FPM at `api:9000`
- **Client-side API path:** `https://api.vendorex.shop/api/v1/...`
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

`ALLOWED_TRANSITIONS` in `Seller/OrderController.php` governs valid status changes:
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
