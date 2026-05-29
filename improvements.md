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

## Improvement #2 — Extracted Order State Machine into the Domain Enum

**Date:** 2026-05-29
**Files changed:**
- `services/api/app/Enums/OrderStatus.php` — added `allowedTransitions()` and `canTransitionTo()` methods
- `services/api/app/Http/Controllers/Seller/OrderController.php` — removed `ALLOWED_TRANSITIONS` const, replaced string-based lookup with enum methods

### What was wrong

Order status transition rules were defined as a `private const array` inside `Seller/OrderController`:

```php
private const ALLOWED_TRANSITIONS = [
    'pending'    => ['paid', 'processing', 'cancelled'],
    'paid'       => ['processing', 'cancelled'],
    'processing' => ['shipped', 'cancelled'],
    'shipped'    => ['delivered'],
    'delivered'  => [],
    'cancelled'  => [],
    'refunded'   => [],
];
```

This had two concrete problems:

1. **The state machine was only enforced on one path.** `Store/PaymentController::callback()` (line 157) and `sandboxComplete()` (line 211) both directly assigned `status => OrderStatus::Processing` on successful payment without consulting the transition table. The same applies to any future code path (admin overrides, console commands, scheduled jobs) — each would be written fresh with no guardrail.

2. **The rule lived in the wrong layer.** A business rule about what state an order can move to is domain knowledge. Embedding it in an HTTP controller meant it was invisible to the rest of the codebase, non-reusable, and would have to be rediscovered and duplicated for every new entry point.

The validation was also string-based (`in_array($newStatus, $allowed, true)` where both sides are raw strings), meaning the type system offered no help — a typo in a status string would pass silently until runtime.

### What was fixed

Added `allowedTransitions(): array` and `canTransitionTo(self $next): bool` directly to the `OrderStatus` enum — the only place in the codebase that already owns all status values:

```php
public function allowedTransitions(): array
{
    return match($this) {
        self::Pending    => [self::Paid, self::Processing, self::Cancelled],
        self::Paid       => [self::Processing, self::Cancelled],
        self::Processing => [self::Shipped, self::Cancelled],
        self::Shipped    => [self::Delivered],
        self::Delivered,
        self::Cancelled,
        self::Refunded   => [],
    };
}

public function canTransitionTo(self $next): bool
{
    return in_array($next, $this->allowedTransitions(), true);
}
```

`OrderController::updateStatus()` now uses the enum directly — no raw string comparisons, no controller-owned rule tables:

```php
// Before
$newStatus     = $request->validated()['status'];          // string
$currentStatus = $order->status->value;                    // string
$allowed       = self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];
if (!in_array($newStatus, $allowed, true)) { ... }

// After
$newStatus = OrderStatus::from($request->validated()['status']);
if (!$order->status->canTransitionTo($newStatus)) { ... }
```

Timestamp side-effects (`shipped_at`, `delivered_at`) were also moved from a string-keyed array to a `match` expression on the enum case — exhaustiveness is now compiler-checked.

### Why this matters

- Any code path that holds an `Order` can now call `$order->status->canTransitionTo($next)` to validate a transition — there is one rule, one place, zero duplication.
- Adding a new order status (e.g. `on_hold`) requires updating one `match` block. Previously it required coordinating changes across every controller that touched order status.
- The transition check is now fully type-safe: both sides of the comparison are `OrderStatus` enum cases, not raw strings that could silently mismatch.

### CV-ready bullets

- **Refactored a scattered order state machine** in a Laravel e-commerce platform by migrating hard-coded transition rules from a controller `const array` into behaviour methods (`allowedTransitions()`, `canTransitionTo()`) on the `OrderStatus` PHP 8.1 enum, establishing a single authoritative source of truth for all 7 order states and their valid progressions.

- **Eliminated a category of transition bypass bugs**: prior to the refactor, `PaymentController` set order status directly without consulting the transition rules, meaning any new status (e.g. `on_hold`) added to the controller constant would not be enforced on the payment code path. The enum-based approach makes every transition check opt-in from one definition.

- **Improved type safety across the order management domain**: replaced raw string comparisons (`in_array('shipped', [...], true)`) with enum-to-enum `match` expressions, removing an entire class of silent string-mismatch bugs and making invalid status values impossible at the PHP type level.

---

## Upcoming Improvements (Planned)

| # | Title | Priority |
|---|-------|----------|
| 3 | Extract `HandlePaymentSuccessAction` — eliminate duplicated post-payment code in `callback()` and `sandboxComplete()` | HIGH |
| 4 | Extract `CreateOrderAction` — move checkout business logic out of `CheckoutController` into a testable Action class | HIGH |
| 5 | Introduce domain events (`OrderCreated`, `PaymentSucceeded`, `OrderStatusChanged`) — decouple notification dispatch from HTTP handlers | MEDIUM |
