# Vendora — Armenian Store Builder Platform

Multi-tenant e-commerce platform that lets Armenian businesses create and manage their own online stores.

## Prerequisites

- Docker Engine 24+
- Docker Compose v2.20+
- Git

## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url> vendora
cd vendora

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker compose up -d

# 4. Watch logs (optional)
docker compose logs -f
```

## Service URLs (Development)

| Service     | URL                      | Notes               |
|-------------|--------------------------|---------------------|
| Main App    | http://localhost         | Next.js frontend    |
| Laravel API | http://api.localhost     | REST API            |
| Mailpit UI  | http://localhost:8025    | Dev email catcher   |
| MySQL       | localhost:3306           | vendora / secret    |
| MongoDB     | localhost:27017          | vendora / secret    |
| Redis       | localhost:6379           |                     |

> **Note:** `api.localhost` resolves to `127.0.0.1` on macOS and Linux automatically.
> On Windows, add `127.0.0.1 api.localhost` to `C:\Windows\System32\drivers\etc\hosts`.

## Useful Commands

```bash
# Stop all services
docker compose down

# Rebuild a specific service
docker compose build api

# Run artisan commands
docker compose exec api php artisan migrate

# Run composer inside the container
docker compose exec api composer install

# Open a shell in the API container
docker compose exec api sh

# Open a shell in the web container
docker compose exec web sh

# View logs for a service
docker compose logs -f api
```

## Architecture

```
vendora/
├── services/
│   ├── api/      # Laravel 13 (PHP 8.5) — REST API
│   └── web/      # Next.js 16 (TypeScript) — Frontend
└── docker/
    ├── nginx/    # Reverse proxy config
    ├── php/      # PHP-FPM Dockerfile + php.ini
    ├── node/     # Node Dockerfile
    └── mysql/    # Database init scripts
```

## Networks

- `vendora-backend` — internal: api, mysql, mongodb, redis, queue, scheduler
- `vendora-frontend` — public-facing: nginx, web, api
