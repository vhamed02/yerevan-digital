# Vendora — Engineering Improvements Log

> This file tracks architectural and correctness improvements made to the Vendora platform.
> Each entry includes CV-ready bullet points with real technical context.

---

## Improvement #1 — Eliminated Latent Production Bug in Payment Gateway Redirect URLs

**Date:** 2026-05-29
**Files changed:**
- `services/api/config/app.php` — added `frontend_url` config key
- `services/api/app/Http/Controllers/Store/PaymentController.php` — replaced 2 `env()` calls with `config()`

### What was wrong

`PaymentController::initiate()` and `PaymentController::sandboxComplete()` both constructed
payment redirect URLs using a direct `env()` call at runtime:

```php
// Before — BROKEN after config:cache
$frontendUrl = rtrim(env('FRONTEND_URL', config('app.url')), '/');
```

Laravel's `env()` function returns `null` for any key that is not defined at runtime when
`php artisan config:cache` (or `optimize`) has been run. Config caching is standard practice
in production Laravel deployments. If triggered, all success/failure redirect URLs sent to
the Idram payment gateway would resolve to `null/store/{slug}/checkout/success`, causing
every payment to land on a 404 instead of the confirmation page — silently breaking the
entire checkout flow with no error logged.

The `FRONTEND_URL` env var (`https://radif.org`) was only present in the root `.env` loaded
by Docker, not in `services/api/.env`, making the fallback to `config('app.url')` also wrong
(that points to the API domain, not the frontend).

### What was fixed

Registered `FRONTEND_URL` as a proper config value in `config/app.php`:

```php
'frontend_url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost')),
```

Replaced both runtime `env()` calls in `PaymentController` with:

```php
// After — safe under config:cache
$frontendUrl = rtrim(config('app.frontend_url'), '/');
```

### Why this matters

- `env()` in application code (outside `config/` files) is a Laravel anti-pattern explicitly
  warned against in the framework docs. Config values are evaluated once at cache time;
  `env()` at runtime returns `null` when the cache exists.
- The affected code path sits inside the Idram payment gateway callback and initiation flow —
  the only live payment integration on the platform.
- The deploy script (`scripts/deploy.sh`) currently runs `optimize:clear`, not `optimize`,
  so the bug was latent. Any future performance hardening (adding `php artisan optimize`)
  would have silently broken payments in production.

### CV-ready bullets

- **Identified and resolved a latent production bug** in a Laravel e-commerce platform's
  payment gateway integration (Idram) where direct `env()` calls in controller code would
  return `null` after config caching, causing all post-payment redirect URLs to become
  invalid and routing customers to 404 pages instead of order confirmation screens.

- **Refactored payment redirect URL construction** across 2 call sites in
  `PaymentController` to use Laravel's config layer (`config('app.frontend_url')`) instead
  of runtime `env()` reads, aligning with Laravel's documented best practices and making
  the codebase safe under `php artisan optimize` / `config:cache` production workflows.

- **Eliminated a class of silent failure** in a live checkout flow: had the bug been
  triggered, every Idram payment callback would have completed server-side (order marked
  paid, notifications sent) while customers were stranded on a 404 — a split-state scenario
  that would require manual reconciliation per affected order.

---

## Upcoming Improvements (Planned)

| # | Title | Priority |
|---|-------|----------|
| 2 | Extract `OrderStateMachine` — unify status transition logic used across 2 controllers | HIGH |
| 3 | Extract `HandlePaymentSuccessAction` — eliminate duplicated post-payment code in `callback()` and `sandboxComplete()` | HIGH |
| 4 | Extract `CreateOrderAction` — move checkout business logic out of `CheckoutController` into a testable Action class | HIGH |
| 5 | Introduce domain events (`OrderCreated`, `PaymentSucceeded`, `OrderStatusChanged`) — decouple notification dispatch from HTTP handlers | MEDIUM |
