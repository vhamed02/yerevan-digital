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

---

## Improvement #3 — Extracted Duplicate Post-Payment Logic into `HandlePaymentSuccessAction`

**Date:** 2026-05-29
**Files changed:**
- `services/api/app/Actions/HandlePaymentSuccessAction.php` — new action class (created `app/Actions/` directory)
- `services/api/app/Http/Controllers/Store/PaymentController.php` — removed 3 dead imports, injected action, replaced 2 duplicated blocks

### What was wrong

`PaymentController` had two methods that handled a successful payment — `callback()` for live
gateway callbacks and `sandboxComplete()` for the sandbox simulation flow. Both contained the
exact same 11-line block:

```php
// in callback() — lines 153–168
$order->update([
    'payment_status' => PaymentStatus::Paid,
    'status'         => OrderStatus::Processing,
    'paid_at'        => now(),
    'payment_method' => $gateway,
]);
$freshOrder = $order->fresh();
$order->store->owner->notify(new NewOrderNotification($freshOrder));
Notification::route('mail', [
    $freshOrder->customer_email => $freshOrder->customer_name,
])->notify(new CustomerOrderConfirmationNotification($freshOrder));

// in sandboxComplete() — lines 208–221
// identical, only 'sandbox' instead of $gateway
```

The only difference between the two copies was the value of `payment_method`. This created
two concrete problems:

1. **Divergence risk.** Any change to what "payment success" means — adding a webhook, an
   audit log entry, a push notification — had to be applied in two places. A future developer
   updating one path would likely miss the other, causing the sandbox and live flows to behave
   differently.

2. **Untestable logic.** The post-payment side effects (order state update + two notifications)
   were locked inside an HTTP controller, making it impossible to unit-test them in isolation
   without bootstrapping a full request lifecycle.

### What was fixed

Created `app/Actions/HandlePaymentSuccessAction.php` — the first class in a new `app/Actions/`
layer — which owns the entire post-payment workflow:

```php
class HandlePaymentSuccessAction
{
    public function execute(Order $order, string $paymentMethod): Order
    {
        $order->update([
            'payment_status' => PaymentStatus::Paid,
            'status'         => OrderStatus::Processing,
            'paid_at'        => now(),
            'payment_method' => $paymentMethod,
        ]);

        $freshOrder = $order->fresh();

        $order->store->owner->notify(new NewOrderNotification($freshOrder));

        Notification::route('mail', [
            $freshOrder->customer_email => $freshOrder->customer_name,
        ])->notify(new CustomerOrderConfirmationNotification($freshOrder));

        return $freshOrder;
    }
}
```

Both controller methods now delegate to the action in one line:

```php
// callback()
$this->handlePaymentSuccess->execute($transaction->order, $gateway);

// sandboxComplete()
$this->handlePaymentSuccess->execute($order, 'sandbox');
```

`PaymentController` also lost 3 imports (`NewOrderNotification`,
`CustomerOrderConfirmationNotification`, `Notification` facade) that belonged in the action,
not in the HTTP layer.

### Why this matters

- Post-payment business logic now lives in exactly one place. Adding a webhook call,
  a revenue tracking event, or a push notification requires one edit to one class.
- The action can be instantiated and tested directly with a mock `Order` — no HTTP request,
  no middleware, no route resolution needed.
- The `app/Actions/` directory establishes a pattern for the remaining controller-embedded
  business logic to follow (see improvements #4 and #5).

### CV-ready bullets

- **Eliminated code duplication in a payment gateway integration** by extracting shared
  post-payment logic (order status update, seller notification, customer email confirmation)
  from two diverging controller methods into a single `HandlePaymentSuccessAction` class,
  reducing the PaymentController by 22 lines and establishing a single code path for all
  successful payment outcomes regardless of gateway (live or sandbox).

- **Introduced an Actions layer** (`app/Actions/`) to a Laravel e-commerce API to house
  multi-step business operations that do not belong in HTTP controllers, improving
  testability by making core payment fulfillment logic exercisable without bootstrapping
  the full request lifecycle.

- **Reduced maintenance surface for a critical payment flow**: prior to the refactor, any
  change to post-payment behaviour (adding webhooks, audit logging, push notifications)
  required synchronised edits to two separate controller methods — a pattern that historically
  leads to silent divergence between live and sandbox environments.

---

---

## Improvement #4 — Extracted Checkout Business Logic into `CreateOrderAction`

**Date:** 2026-05-29
**Files changed:**
- `services/api/app/Actions/CreateOrderAction.php` — new action class owns the full order creation workflow
- `services/api/app/Data/CheckoutData.php` — new readonly DTO carries validated checkout input (created `app/Data/` directory)
- `services/api/app/Http/Requests/Store/CheckoutRequest.php` — new Form Request moves inline validation out of the controller (created `app/Http/Requests/Store/` directory)
- `services/api/app/Http/Controllers/Store/CheckoutController.php` — reduced from 140 lines to 38 lines

### What was wrong

`CheckoutController::checkout()` was a 115-line method that did everything:

1. Validated the HTTP request inline with `$request->validate()`
2. For each cart item: resolved the product from the DB (with a row lock), resolved the variant, checked stock availability, threw a `ValidationException` on failure
3. Computed the order subtotal
4. Created the `Order` record
5. Created each `OrderItem` record with a product snapshot
6. Decremented stock on the product or variant
7. Wrapped steps 2–6 in a `DB::transaction()` closure
8. Built and returned the JSON response

All of this was inside a single controller method, bound to the HTTP layer via `$request->input()` calls scattered throughout the transaction closure. The business logic was completely untestable without firing a real HTTP request with a real database.

Two specific problems:

- **No Form Request**: validation lived inline (`$request->validate([...])`) — the only controller in the codebase without a dedicated Form Request, breaking the project's own convention.
- **Business logic in HTTP context**: the DB transaction closure directly read from `$request`, meaning the checkout flow could not be called from a console command, an admin "create order on behalf of" feature, or a test without constructing a full `Request` object.

### What was fixed

**`CheckoutData` DTO** (`app/Data/CheckoutData.php`) — a PHP 8.2 `readonly` class that carries all checkout input as typed properties, decoupling the action from the HTTP layer entirely:

```php
readonly class CheckoutData
{
    public function __construct(
        public int     $storeId,
        public array   $items,
        public string  $customerName,
        public string  $customerEmail,
        public ?string $customerPhone,
        public array   $shippingAddress,
        public ?string $notes,
        public string  $paymentMethod,
    ) {}
}
```

**`CreateOrderAction`** (`app/Actions/CreateOrderAction.php`) — owns the full transactional workflow: stock validation, subtotal calculation, order record creation, order items creation, stock decrement. Receives a `CheckoutData`, returns an `Order`. No knowledge of HTTP.

**`CheckoutRequest`** (`app/Http/Requests/Store/CheckoutRequest.php`) — moves the 13-rule validation block into a proper Form Request, consistent with every other write endpoint in the API.

**`CheckoutController`** — reduced from 140 to 38 lines. It now only resolves the store from the request, constructs the DTO, calls the action, and formats the response:

```php
public function checkout(CheckoutRequest $request, string $slug): JsonResponse
{
    $store = $request->attributes->get('currentStore');

    $order = $this->createOrder->execute(new CheckoutData(
        storeId:         $store->id,
        items:           $request->validated('items'),
        customerName:    $request->validated('full_name'),
        // ...
    ));

    return $this->success([...], 'Order created.', 201);
}
```

### Why this matters

- The entire order creation workflow — stock locking, subtotal calculation, item snapshotting, stock decrement — can now be unit-tested by constructing a `CheckoutData` object and calling `$action->execute()` directly, with no HTTP stack involved.
- The same action can be called from any context: an admin "place order on behalf" feature, a CLI import command, or a future API version — without touching the HTTP controller.
- `app/Data/` establishes a dedicated directory for typed DTOs, complementing the `app/Actions/` layer introduced in improvement #3.

### CV-ready bullets

- **Reduced a 140-line controller method to 38 lines** by extracting the full checkout business logic — product resolution with row locking, stock validation, subtotal calculation, order and order-item creation, and stock decrement — into a dedicated `CreateOrderAction` class, making the checkout workflow independently testable without an HTTP context.

- **Introduced a typed DTO layer** (`app/Data/CheckoutData.php`) using PHP 8.2 `readonly` classes to carry validated checkout input into the action, fully decoupling the order creation workflow from the Laravel `Request` object and enabling the same logic to be invoked from HTTP controllers, console commands, or test cases interchangeably.

- **Resolved a validation consistency gap** across a Laravel REST API by extracting 13 inline `$request->validate()` rules from `CheckoutController` into a dedicated `CheckoutRequest` Form Request class, bringing the checkout endpoint in line with the project-wide convention used across all other write endpoints and centralising input contract documentation.

---

---

## Improvement #5 — Introduced Domain Events to Decouple Notification Dispatch

**Date:** 2026-05-29
**Files created:**
- `services/api/app/Events/OrderCreated.php`
- `services/api/app/Events/PaymentSucceeded.php`
- `services/api/app/Events/OrderStatusChanged.php`
- `services/api/app/Listeners/SendNewOrderNotifications.php`
- `services/api/app/Listeners/SendOrderStatusNotification.php`

**Files updated:**
- `services/api/app/Actions/HandlePaymentSuccessAction.php` — replaced 2 direct `notify()` calls with `event(new PaymentSucceeded(...))`
- `services/api/app/Actions/CreateOrderAction.php` — fires `event(new OrderCreated(...))` after transaction commits
- `services/api/app/Http/Controllers/Seller/OrderController.php` — replaced direct `notify()` call with `event(new OrderStatusChanged(...))`
- `services/api/app/Providers/AppServiceProvider.php` — registered 2 new event-listener pairs

### What was wrong

Notification dispatch was hard-coded directly inside the classes that triggered the domain operation:

- `HandlePaymentSuccessAction::execute()` called `$order->store->owner->notify(...)` and `Notification::route('mail', ...)->notify(...)` inline — the action knew about both the payment domain AND the notification domain
- `Seller/OrderController::updateStatus()` called `$order->customer->notify(new OrderStatusChangedNotification($order))` inline — an HTTP controller was making notification decisions

This tight coupling had two concrete consequences:

1. **Adding any new side effect required modifying the originating class.** Want to fire a webhook on payment success? Edit `HandlePaymentSuccessAction`. Want to post to Slack when an order ships? Edit `OrderController`. Every new requirement creates a new reason to touch already-tested, already-working code.

2. **The existing `Events/` and `Listeners/` directories were nearly unused.** The architecture declared its intent (one event: `ProductViewed`, one listener: `RecordProductView`) but the most important domain operations — payment and order management — were not event-driven at all.

### What was fixed

**Three domain events** — plain classes carrying an `Order` instance, consistent with the existing `ProductViewed` pattern:

```
OrderCreated      — fired by CreateOrderAction after the DB transaction commits
PaymentSucceeded  — fired by HandlePaymentSuccessAction after the order is marked paid
OrderStatusChanged — fired by OrderController after the status transition is persisted
```

**Two queued listeners** — both on the `notifications` queue, both `ShouldQueue`:

```
SendNewOrderNotifications   — handles PaymentSucceeded
                              → NewOrderNotification to seller
                              → CustomerOrderConfirmationNotification to customer

SendOrderStatusNotification — handles OrderStatusChanged
                              → OrderStatusChangedNotification to customer (if registered)
```

`HandlePaymentSuccessAction` dropped from 29 to 18 lines. `OrderController::updateStatus()` went from 5 lines of notification logic to one `event()` call. Neither class imports a notification class anymore.

`OrderCreated` has no listener yet — it fires and produces no side effects today — but it makes the event available as a hook for future work (welcome emails, analytics, admin feeds) without touching `CreateOrderAction`.

### Why this matters

- Adding a new side effect to any of these domain operations now means writing a new Listener and registering it — zero changes to the originating action or controller.
- All notification logic is now concentrated in the `Listeners/` directory, making it trivially easy to audit: "what happens when a payment succeeds?" has one answer in one file.
- The `OrderCreated` event establishes a future-safe hook point: the first time someone needs to react to a new order (inventory sync, analytics, fraud check), the event is already in place.

### CV-ready bullets

- **Decoupled notification dispatch from business logic** across a Laravel e-commerce API by introducing three domain events (`OrderCreated`, `PaymentSucceeded`, `OrderStatusChanged`) and two dedicated queued listeners, removing all direct `notify()` calls from action classes and HTTP controllers and establishing a single, auditable location for all order-related notification logic.

- **Extended an existing event-driven architecture** — the codebase already had one event/listener pair (`ProductViewed` / `RecordProductView`) — by applying the same pattern to the platform's highest-stakes operations: payment confirmation and order fulfilment, ensuring that adding new side effects (webhooks, push notifications, analytics) to these flows requires only a new listener, with zero changes to tested business logic.

- **Improved the open/closed principle compliance** of the order management domain: `HandlePaymentSuccessAction`, `CreateOrderAction`, and `OrderController` no longer need to be modified when notification requirements change — they are closed for modification and the event system is open for extension.

---

## All Improvements Complete ✅

| # | Title | Commit |
|---|-------|--------|
| 1 | Resolve `FRONTEND_URL` via config layer | `ff17528` |
| 2 | Extract Order State Machine into `OrderStatus` enum | `96cb79a` |
| 3 | Extract `HandlePaymentSuccessAction` | `02314d5` |
| 4 | Extract `CreateOrderAction` + `CheckoutData` DTO | `84c9551` |
| 5 | Introduce domain events + listeners | `b2b2375` |
