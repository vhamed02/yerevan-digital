# Admin Reporting Service — Design Document

**Status:** Proposal (planning only — no implementation until approved)
**Owner:** Vendora
**Last updated:** 2026-06-01


A standalone **Go** service that powers the super-admin reporting surface: a fast, drill-down
view of every store, product, seller, order, and revenue figure on the platform, plus
large streaming exports and global search.

---

## 1. Goals & non-goals

**Goals**
- Give super-admin a comprehensive, filterable, drill-down report across all entities.
- Serve "platform overview" dashboards assembled from many aggregations, fast.
- Stream large exports (every store / product / order) with constant memory.
- Global search across stores, products, sellers.
- Demonstrate event-driven + CQRS architecture with production rigor.

**Non-goals**
- It does **not** own any writes. Approving/suspending stores, editing products, etc. stay
  in the Laravel monolith. This service is **read-only**.
- It is not a general BI tool replacement (Metabase/Grafana would be the off-the-shelf
  product answer; we build this for a tailored, embedded admin UX and as an architecture
  showcase).

**Honest framing of "why Go"**
- Go does **not** make a slow SQL aggregation faster — the database is the bottleneck.
- Go's real value here is: (1) **parallel fan-out** of the dozens of independent
  aggregations a dashboard needs; (2) **constant-memory streaming exports**; (3) cheap
  concurrent request serving; (4) a clean home for an **event-driven read model**.

---

## 2. Reporting surface (scope)

| Area | Views |
|------|-------|
| **Platform overview** | Totals (stores, sellers, products, orders, GMV, revenue), growth/trends, status funnels |
| **Stores** | Filterable list (status, featured, revenue, #orders, created); per-store drill-down: products, orders, revenue, top products, reviews, conversion |
| **Sellers** | List + activity; stores owned, lifetime revenue, status history, last login |
| **Products** | Catalog-wide; top sellers, low/out-of-stock, by category, views-vs-sales |
| **Orders** | Volume, status funnel, AOV, by store/time, payment-method & gateway breakdown, refunds |
| **Revenue / finance** | GMV & net revenue time series, by gateway, refunds |
| **Search** | Fast lookup of any store / product / seller |
| **Exports** | Streaming CSV/Excel of any list above |

---

## 3. Architecture

```
                       ┌──────────────────────────────────────────┐
   Admin (Next.js) ───▶│  nginx / Cloudflare                       │
                       └───────────────┬───────────────┬──────────┘
                                       │ writes        │ reads
                                       ▼               ▼
                          ┌─────────────────┐   ┌──────────────────────┐
                          │ Laravel monolith │   │  Go Admin Reporting   │
                          │  (command side)  │   │  service (query side) │
                          └───────┬─────────┘    └──────┬────────┬──────┘
              writes + outbox row │ (same tx)            │        │
                                  ▼                      │        │ read
                          ┌──────────────┐   events     │        ▼
                          │  MySQL (OLTP) │──────────────┘   ┌─────────────┐
                          │  + outbox tbl │  Redis Streams   │ Read store  │
                          └──────┬────────┘   (relay)        │ (projections│
                                 │ replica (Phase 1 reads)   │  + search)  │
                                 └───────────────────────────┴─────────────┘
```

**Strangler-fig:** the service sits beside the monolith. The admin UI calls it for reads;
the monolith keeps the writes. Nothing is removed from Laravel.

**CQRS:** write model (Laravel, normalized OLTP) and read model (Go, denormalized,
query-optimized) are separated. They synchronize via events.

---

## 4. Phased delivery (de-risks + gives a clean narrative)

### Phase 1 — Read-replica reporting (no events yet)
- Go service reads a **MySQL read replica** (read-only credentials).
- **Parallel fan-out** aggregation: a dashboard request spawns N goroutines, one per metric,
  and assembles the result in ~max(query) instead of sum(query).
- **Read-through caching** in Redis for hot aggregates (own keyspace, JSON — never Laravel's
  PHP-serialized cache).
- **Streaming exports** (CSV) over chunked HTTP.
- Auth, health, metrics, CI.
- *Reading a replica read-only is an accepted reporting pattern — not the write-coupling
  anti-pattern.*

**Outcome:** real value fast; the headline Go wins (parallel aggregation + streaming exports)
are already demonstrable.

### Phase 2 — Event-driven read model (CQRS)
- Add the **transactional outbox** in Laravel + **Redis Streams** bus + Go **consumer**.
- Build **projections** (denormalized read tables) for the heavy/cross-cutting views.
- Add **search** via Meilisearch/Typesense kept in sync by the consumer.
- Projection **rebuild/replay** tooling.

**Outcome:** the architecture-showcase version — event-driven, eventually consistent,
rebuildable read model.

---

## 5. Data strategy

- **Phase 1 read source:** MySQL read replica (or the primary, read-only, if a replica isn't
  available yet). Honors soft-deletes and the translatable JSON columns (`name->en/hy/ru`).
- **Phase 2 read store options** (trade-offs to decide at the boundary):
  - **MySQL/Postgres projection tables** — simplest, denormalized per view. *Recommended start.*
  - **ClickHouse / columnar** — true analytics at scale; impressive but overkill now (note as
    a future option, don't build yet).
  - **Search engine** (Meilisearch / Typesense) — *deferred*; v1 uses MySQL `LIKE`/`FULLTEXT`.
- The read store is **derived data**: it can always be rebuilt from events (or re-seeded from
  the monolith). It is never a source of truth.

---

## 6. Event design (the CQRS backbone)

**Producing events — Transactional Outbox (recommended)**
- Laravel writes an `outbox` row **in the same DB transaction** as the state change
  (e.g. order paid → orders row update + outbox insert atomically).
- A small relay (Laravel scheduled command or a tiny worker) publishes unpublished outbox rows
  to the bus and marks them sent.
- Guarantees **no lost events** even if the bus is briefly down — avoids the dual-write
  problem of "observer publishes directly after commit."
- *Existing assets to leverage:* Laravel already has domain events (`OrderCreated`,
  `PaymentSucceeded`, `OrderStatusChanged`) and model observers, plus an `audits` table
  (owen-it/laravel-auditing) that already records created/updated/deleted for several models.
  These are natural hook points to populate the outbox.

**Bus:** **Redis Streams** (we already run Redis; supports consumer groups, acks, replay with
retention). *Kafka/NATS JetStream noted as scale-up options — not now.*

**Event envelope (versioned JSON):**
`{ id, type, version, occurred_at, aggregate_type, aggregate_id, payload }`

**Event catalog (initial):**
- Store: `StoreCreated`, `StoreUpdated`, `StoreApproved`, `StoreSuspended`, `StoreFeatured`
- Seller/User: `SellerRegistered`, `SellerStatusChanged`
- Product: `ProductCreated`, `ProductUpdated`, `ProductDeleted`, `ProductStockChanged`
- Order: `OrderPlaced`, `OrderPaid`, `OrderStatusChanged`, `OrderRefunded`
- Review: `ReviewApproved`

**Consuming events — idempotent projections**
- Go consumer in a **consumer group**, **at-least-once** delivery.
- **Idempotency / Inbox:** dedupe by event `id`; projections are **upserts** keyed by
  aggregate id, applying only if `event.version > stored.version` (tolerant, ordered apply).
- **Rebuildable:** replay the stream (within retention) or re-derive from the monolith to
  rebuild a projection from scratch — designed in from day one.
- **Lag monitoring:** expose consumer lag as a metric; alert if the read model falls behind.

---

## 7. Design patterns (explicit)

| Pattern | Where / why |
|---------|-------------|
| **CQRS** | Read/write separation — the core of the design |
| **Event-driven** | Monolith → bus → read model sync |
| **Transactional Outbox** | Atomic, no-loss event publication from Laravel |
| **Inbox / idempotent consumer** | At-least-once delivery → exactly-once *effect* |
| **Materialized views / projections** | Denormalized, query-optimized read tables |
| **Fan-out / fan-in concurrency** | Go-specific: parallel aggregation per dashboard |
| **Read-through cache** | Hot aggregates in Redis (own keyspace) |
| **Ports & adapters (hexagonal)** | Service internals: domain core isolated from MySQL/Redis/HTTP |
| **Repository pattern** | Read-store access behind interfaces (mirrors monolith style) |
| **Circuit breaker / graceful degradation** | If projections stale/unavailable, fall back to replica reads with a "data may be delayed" flag |
| **Backpressure** | Bounded worker pools on event consumption and aggregation fan-out |

**Deliberately NOT used (shows judgment):**
- **Saga / distributed transactions** — there are no cross-service writes on the read side;
  a saga would be cargo-culting.
- **Kafka / ClickHouse / k8s** — scale tools unjustified at current volume; named as future
  options only.

---

## 8. API design

- **Protocol:** REST/JSON over HTTP — the Next.js admin UI is the direct client, so REST is the
  pragmatic fit. (gRPC noted as an internal option but not needed; the client is a browser app.)
- **Read-only endpoint catalog (illustrative):**
  - `GET /reports/overview` — platform totals + trends (parallel fan-out)
  - `GET /reports/stores` , `GET /reports/stores/{id}`
  - `GET /reports/sellers` , `GET /reports/sellers/{id}`
  - `GET /reports/products` , `GET /reports/orders` , `GET /reports/revenue`
  - `GET /search?q=` — cross-entity search
  - `GET /exports/{entity}?format=csv` — **streaming** export
- Conventions: cursor/offset pagination, consistent filter/sort params, `as_of` timestamp on
  every response (so the UI can show "data as of …" for eventual consistency).

---

## 9. Auth & security

- **Token validation without a Laravel round-trip:** the service hashes the presented
  **Sanctum bearer token** (SHA-256) and looks it up in `personal_access_tokens`, then checks
  the user holds the **admin** role (Spatie tables). Read-only DB credentials.
- All endpoints require admin; **audit who exported what** (export is sensitive — it's the
  whole platform's data).
- Network: internal service on the `vendora-backend` Docker network; exposed only via nginx on
  an admin path / subdomain; rate-limited.

---

## 10. Integration & deployment

- New container in `docker-compose` on `vendora-backend` (+ `vendora-frontend` for nginx).
- nginx route (e.g. `/api/admin-reports/*` or `admin-api.yerevan.digital`) → Go service.
- Next.js admin panel calls it (SSR via nginx internal name, client via the public path).
- Fits the existing deploy flow (webhook → `deploy.sh` builds/recreates containers).
- **Production rigor (the part that actually impresses):**
  - `/health` + `/metrics` (Prometheus), structured logging (slog), graceful shutdown.
  - Config via env; read-only DB user; secrets via env_file (same model as the monolith).
  - CI (build, vet, test); optional OpenTelemetry tracing.

---

## 11. Consistency & failure modes

- **Eventual consistency:** read model trails writes by ~seconds; surfaced via `as_of`.
- **Event lag:** monitored; alert if consumer falls behind threshold.
- **Outbox relay down:** events queue in the outbox table; published on recovery (no loss).
- **Projection drift:** periodic reconciliation against source counts; one-command rebuild.
- **Degraded mode:** if a projection is unavailable, fall back to replica queries and flag the
  response as possibly delayed.

---

## 12. Proposed Go stack (minimal)

- Router: stdlib `net/http` (or `chi`); DB: `sqlx`/`pgx`; Redis: `go-redis` (Streams);
  metrics: `prometheus/client_golang`; logging: `slog`; tests: `testcontainers-go`.
- Keep dependencies lean and idiomatic.

---

## 13. Testing strategy

- **Unit:** aggregation/report builders and projection appliers as pure functions (no I/O).
- **Integration:** `testcontainers` (MySQL/Redis) — event → project → query round-trips;
  streaming export correctness; auth/token validation.
- **Contract tests:** event-envelope schema shared by Laravel producer and Go consumer
  (prevents silent schema drift — a real interview talking point).
- **Load test:** parallel-aggregation latency and export memory profile (capture the benchmark
  for the README/CV).

---

## 14. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Dual-write / lost events | Transactional outbox |
| Event schema coupling | Versioned events, tolerant-reader consumer, contract tests |
| Shared-DB anti-pattern | Read-only DB access, P1 (replica later); owned projection store (P2) |
| Scope creep | Strict phasing; P1 ships value without events |
| "Reinventing BI" | Justified as custom embedded UX + learning; Metabase acknowledged |
| Eventual-consistency confusion | `as_of` timestamps + lag monitoring |

---

## 15. Milestones

**Committed scope = M0–M3** (Phase 1: the complete, working reporting panel).
**M4–M5 = optional / showcase** (Phase 2: event-driven CQRS) — only started if you decide
it's worth it after using the MVP. Not needed for performance at current scale.

| ID | Phase | Milestone | Delivers |
|----|-------|-----------|----------|
| **M0** | 1 (committed) | Scaffold | Service skeleton, config, `/health`, `/metrics`, Sanctum-token auth, Dockerfile, CI, one read-only endpoint proving the wiring |
| **M1** | 1 (committed) | Reports | `overview` (parallel fan-out) + stores/sellers/products/orders list endpoints, reading primary MySQL read-only |
| **M2** | 1 (committed) | Exports | Streaming CSV exports with a constant-memory benchmark |
| **M3** | 1 (committed) | Search | MySQL (`LIKE`/`FULLTEXT`) `/search` across stores/products/sellers |
| **M4** | 2 (optional) | Event read model | Laravel transactional outbox + Redis Streams + idempotent Go consumer + first projections (stores, sellers) |
| **M5** | 2 (optional) | Scale & ops | Migrate heavy views to projections; rebuild/replay tooling; lag metrics; degraded-mode fallback |

**CV stopping points:** M3 = a complete Go reporting service (parallel aggregation, streaming
exports, search, auth, metrics, CI) — already a strong story. M4–M5 elevate it to the full
event-driven CQRS showcase.

---

## 16. Locked decisions

1. **Phase-1 data source:** read the **primary MySQL, read-only** (dedicated read-only user).
   No replica setup now — a read replica is a later, drop-in optimization.
2. **Search:** **MySQL** (`LIKE` / `FULLTEXT`) inside the service for v1 — *no Meilisearch yet.*
   Add a search engine only if/when search quality or load demands it.
3. **Phase-2 read store (when built):** **MySQL projection tables.** Postgres/ClickHouse deferred.
4. **Surfacing:** nginx path **`/api/admin-reports/`** (no new subdomain).
5. **Start altitude:** **Phase 1 MVP first**, structured so it evolves cleanly into the
   event-driven CQRS read model (Phase 2). Phase 2 is *not* built until Phase 1 is in use.

## 17. Final stack (locked, intentionally lean)

| Concern | Choice | Notes |
|---------|--------|-------|
| Language | **Go** (latest stable) | |
| Routing | stdlib `net/http` + **`chi`** | minimal router, no framework |
| Concurrency | goroutines + **`x/sync/errgroup`** | parallel aggregation fan-out |
| MySQL access | **`sqlx`** + `go-sql-driver/mysql` | read-only user |
| Caching | **`go-redis`**, own JSON keyspace | light read-through for `overview` only |
| Auth | hash Sanctum token → `personal_access_tokens` + admin role | no extra deps |
| Exports | stdlib `encoding/csv` | streamed (chunked, constant memory) |
| Logging | stdlib **`slog`** (JSON) | |
| Metrics/health | `prometheus/client_golang` + `/health` | cheap, good signal |
| Lifecycle | graceful shutdown, env config | |
| Tests | stdlib `testing` + **`testcontainers-go`** | unit (pure builders) + integration |
| Deploy | Dockerfile, compose service on `vendora-backend`, nginx route | fits `deploy.sh` |

**Deferred to Phase 2 (not now):** transactional outbox, Redis Streams bus, Go event
consumer, projection tables, replay/rebuild tooling. **Deferred indefinitely unless needed:**
Meilisearch/Typesense, Postgres/ClickHouse, Kafka/NATS, read replica, OpenTelemetry tracing.

---

## 18. Versioning & reversibility (must be fully undoable)

The whole experiment must be reversible to today's state, leaving **no Go residue** (Go only
ever runs inside a Docker build stage — never installed on the host).

**Three layers of safety:**
1. **Git tag checkpoint** — tag the current commit (`pre-admin-reporting`) as a permanent
   bookmark of today's state. `git checkout pre-admin-reporting` restores it exactly, anytime.
2. **Dedicated feature branch** (`feat/admin-reporting`) — all work, including this doc, lives
   there. `main` stays exactly as it is. The deploy webhook only deploys `main`, so the branch
   **never auto-deploys** to production. Don't like it → delete the branch (nothing to undo).
   Like it → merge.
3. **Self-contained & additive** — the service is a new `services/admin-reports/` folder with
   its own Dockerfile, one new `docker-compose` service, and one nginx route. It **changes no
   existing Laravel/Next code** (Phase 1 is read-only). Even a post-merge rollback is just:
   revert the commits (or delete the folder) + remove the compose service block + nginx route +
   drop the read-only MySQL user.

**Safe even while running:** read-only MySQL user (cannot modify data); separate container (its
failure can't affect storefront/API/seller panel).

**Working agreement:** build on the branch, milestone by milestone (§15), with tests, committing
as each lands. Nothing reaches production until you review the branch and explicitly merge.
