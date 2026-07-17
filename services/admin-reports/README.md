# admin-reports

A standalone, **read-only** Go service that powers the Yerevan Digital super-admin reporting surface
(stores, products, sellers, orders, revenue, search, exports). It is the **query side** of a
CQRS split — the Laravel monolith keeps all writes.

See the full design in [`docs/admin-reporting-service.md`](../../docs/admin-reporting-service.md).

## Status

**Phase 1 complete (M0–M3).** Scaffold + admin auth (M0), overview via parallel fan-out +
filterable/paginated lists (M1), streaming CSV exports (M2), cross-entity search (M3).
Reads the primary MySQL read-only. Phase 2 (event-driven CQRS) is optional/future.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | none | Liveness + database ping |
| GET | `/metrics` | none | Prometheus metrics |
| GET | `/api/admin-reports/me` | admin | Authenticated admin (proves token → user → role wiring) |
| GET | `/api/admin-reports/overview` | admin | Platform totals, status breakdowns, revenue, last-30-days, top stores — assembled via concurrent fan-out |
| GET | `/api/admin-reports/stores` | admin | Stores list — filters: `q`, `status`; with order count + revenue |
| GET | `/api/admin-reports/sellers` | admin | Sellers list — filters: `q`, `status`; with store + lifetime revenue |
| GET | `/api/admin-reports/products` | admin | Products list — filters: `q`, `status`, `store_id` |
| GET | `/api/admin-reports/orders` | admin | Orders list — filters: `q`, `status`, `payment_status`, `store_id`, `from`, `to` |
| GET | `/api/admin-reports/search` | admin | Cross-entity search (`q`, `limit`) across stores/products/sellers/orders, grouped |
| GET | `/api/admin-reports/exports/{entity}` | admin | Streaming CSV export of `stores`/`sellers`/`products`/`orders` (same filters as the list) |

List endpoints accept `page` and `per_page` (default 20, max 100) and return `{ data, meta }`.
Exports ignore pagination and stream the full filtered result set.

## Auth

Validates the existing Laravel **Sanctum** bearer token (`{id}|{plaintext}`) by hashing the
plaintext (SHA-256) and matching it against `personal_access_tokens`, then requires the user to
hold the Spatie `admin` role. No round-trip to the monolith. Uses a **read-only** MySQL user.

## Configuration (env)

| Variable | Default | Notes |
|----------|---------|-------|
| `ADMIN_REPORTS_ADDR` | `:8090` | Listen address |
| `DB_HOST` / `DB_PORT` | `mysql` / `3306` | Shared MySQL |
| `DB_DATABASE` | `vendora` | |
| `ADMIN_REPORTS_DB_USERNAME` / `ADMIN_REPORTS_DB_PASSWORD` | falls back to `DB_USERNAME` / `DB_PASSWORD` | prefer a dedicated read-only user |
| `AUTH_USER_MODEL` | `App\Models\User` | Spatie `model_has_roles.model_type` |

## Build & test (no Go toolchain on host required)

```bash
# from services/admin-reports
docker run --rm -v "$PWD":/src -w /src golang:1.23-alpine sh -c "go vet ./... && go test ./... && go build ./cmd/server"
```

## Isolation / reversibility

Self-contained directory + its own Docker image + one compose service. Changes no existing
Laravel/Next code. Built entirely on the `feat/admin-reporting` branch; the baseline is tagged
`pre-admin-reporting`. Removing the feature = drop this folder, its compose service, and the
read-only DB user.
