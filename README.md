# Yerevan Digital — Armenian Store Builder Platform

Yerevan Digital is a multi-tenant e-commerce platform built for Armenian businesses. Sellers register, create a branded online store, manage products and orders, and accept payments via Armenian payment gateways (Idram — wallet and bank card — plus Telcell, with Inecobank and Converse Bank stubs ready to activate).

```
                       ┌──────────────────────────────────────────────┐
                       │                 NGINX 1.25                    │
                       │  yerevan.digital       → Next.js 16                │
                       │  api.yerevan.digital   → Laravel 13                │
                       └─────────┬───────────────────┬────────────────┘
                                 │                   │
                     ┌───────────▼────┐   ┌──────────▼──────────┐
                     │   Next.js 16   │   │    Laravel 13        │
                     │  TypeScript    │──▶│    PHP 8.5           │
                     │                │   │  ┌──────────────┐   │
                     │  /            │   │  │ Intervention  │   │
                     │  /admin       │   │  │ Image 3.x     │   │
                     │  /seller      │   │  └──────────────┘   │
                     │  /store/:slug │   │  ┌──────────────┐   │
                     └────────────────┘   │  │ Brevo Email  │   │
                                          │  └──────────────┘   │
                                          └──────────┬──────────┘
                                                     │
                        ┌────────────────────────────┴───────────────────────┐
                        │                                                    │
                 ┌──────▼──────┐                                    ┌────────▼──────┐
                 │  MySQL 8.0  │                                    │   Redis 7.x   │
                 │  users      │                                    │  Cache        │
                 │  stores     │                                    │  Queue jobs   │
                 │  products   │                                    │  Rate limits  │
                 │  orders     │                                    └───────────────┘
                 └─────────────┘
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend API | Laravel | 13.x |
| Runtime | PHP | 8.5 |
| Frontend | Next.js | 16.2.6 (TypeScript) |
| Primary DB | MySQL | 8.0 |
| Cache & Queue | Redis | 7.x |
| Web Server | Nginx | 1.25 |
| Containers | Docker + Compose | Latest |
| Auth | Laravel Sanctum | Latest |
| Permissions | Spatie Permission | Latest |
| Image Processing | Intervention Image | 3.x |
| Email | Brevo API v3 | — |
| Payments | Idram (wallet + card), Telcell (+ stubs) | — |
| Styling | Tailwind CSS 4 + Radix UI | Latest |
| i18n | next-intl | Latest |
| API Docs | Scramble | Latest |

## Prerequisites

- Docker Engine 24+
- Docker Compose v2.20+
- Git

## Local Setup

```bash
git clone https://github.com/vhamed02/yerevan-digital vendora
cd vendora
cp .env.example .env        # edit with your values
docker compose up -d
docker compose exec api php artisan migrate --seed
```

## Access URLs

| URL | Description |
|-----|-------------|
| http://localhost | Main website |
| http://localhost/admin | Admin panel |
| http://localhost/seller | Seller panel |
| http://localhost/store/demo-artisan | Demo storefront (artisan) |
| http://localhost/store/demo-fashion | Demo storefront (fashion) |
| http://localhost/store/demo-tech | Demo storefront (tech) |
| http://api.localhost/api/docs | API documentation (Scramble) |
| http://api.localhost/api/v1/health | Health check endpoint |
| http://localhost:8025 | Mailpit (email preview) |

> `api.localhost` resolves automatically on macOS/Linux. Windows: add `127.0.0.1 api.localhost` to hosts file.

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@yerevan.digital | password |
| Demo Seller 1 (Artisan) | demo1@yerevan.digital | password |
| Demo Seller 2 (Fashion) | demo2@yerevan.digital | password |
| Demo Seller 3 (Tech) | demo3@yerevan.digital | password |

Load demo data:
```bash
docker compose exec api php artisan db:seed --class=DemoSeeder
```

## Running Tests

```bash
# Laravel feature & unit tests
docker compose exec api php artisan test --no-coverage

# Next.js component & store tests
cd services/web && pnpm test
```

## Production Deployment

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose exec api php artisan migrate --force
docker compose exec api php artisan optimize
docker compose exec api php artisan storage:link
```

## How to Add a New Payment Gateway

> **Never write a payment gateway without the provider's real API documentation.** A guessed
> protocol looks complete and passes self-written tests. Idram shipped that way and could not
> have taken a single payment; it was rewritten from the official PDF on 2026-08-04.

1. Create `app/Services/PaymentGateway/Gateways/YourGateway.php` implementing `PaymentGatewayInterface` (see `IdramGateway` or `TelcellGateway` as reference). Also implement `SupportsPrecheck` if the provider sends an authenticity request before moving money.
2. Add gateway record to `PaymentGatewaySeeder.php`. `required_fields` **must** use the `[{key, label_hy, label_en}]` shape — a flat array of strings renders no inputs in the seller UI.
3. Register in `PaymentServiceProvider` inside `PaymentGatewayRegistry`: `$registry->register('your_key', new YourGateway())`. **The registry key must equal the seeded DB `name`.**
4. Handle the gateway-specific callback format in `PaymentController::callback()` if it differs from the JSON default
5. Run `php artisan db:seed --class=PaymentGatewaySeeder` locally. **On production, seeders never run** — `scripts/deploy.sh` only migrates, so shipping a row change needs a data migration.

## How to Add a New Store Template

1. Add the template key and name to `StoreTemplateSeeder.php`
2. Create the template page in `services/web/src/app/[locale]/store/[slug]/(templates)/your-key/page.tsx`
3. Register it in the `TEMPLATES` map in `services/web/src/lib/templates.ts`
4. Run `php artisan db:seed --class=StoreTemplateSeeder` to register the new template
5. Sellers can switch to it via the Seller Panel → Store → Templates

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_KEY` | Laravel app key | `base64:...` |
| `APP_URL` | API base URL | `http://api.yerevan.digital` |
| `DB_HOST` | MySQL host | `mysql` |
| `DB_DATABASE` | MySQL database name | `vendora` |
| `DB_USERNAME` | MySQL user | `vendora` |
| `DB_PASSWORD` | MySQL password | `secret` |
| `REDIS_HOST` | Redis host | `redis` |
| `BREVO_API_KEY` | Brevo transactional email key | `xkeysib-...` |
| `MAIL_FROM_ADDRESS` | Default sender email | `hello@yerevan.digital` |
| `FRONTEND_URL` | Next.js public URL | `https://yerevan.digital` |
| `IDRAM_PLATFORM_REC_ACCOUNT` | Platform Idram ID, for collecting commission invoices | `100000114` |
| `IDRAM_PLATFORM_SECRET_KEY` | Platform Idram secret key | — |
| `TELCELL_PLATFORM_ISSUER` | Platform Telcell shop email | `billing@yerevan.digital` |
| `TELCELL_PLATFORM_SHOP_KEY` | Platform Telcell shop key | — |

## Useful Commands

```bash
# Run artisan commands
docker compose exec api php artisan <command>

# Open shell in API container
docker compose exec api sh

# Rebuild a service
docker compose build api

# View logs
docker compose logs -f api

# Clear all caches
docker compose exec api php artisan optimize:clear
```
