# admin-reports

A standalone, **read-only** Go service that powers the Vendora super-admin reporting surface
(stores, products, sellers, orders, revenue, search, exports). It is the **query side** of a
CQRS split — the Laravel monolith keeps all writes.

See the full design in [`docs/admin-reporting-service.md`](../../docs/admin-reporting-service.md).

## Status

**M0 — scaffold.** Service skeleton, configuration, health/metrics, Sanctum-token admin auth,
and one authenticated endpoint proving the database wiring. No reports yet (M1+).

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | none | Liveness + database ping |
| GET | `/metrics` | none | Prometheus metrics |
| GET | `/api/admin-reports/me` | admin | Returns the authenticated admin (proves token → user → role wiring) |

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
