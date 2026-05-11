# 🛍️ Vendora — Armenian Store Builder Platform
## Full-Stack E-Commerce Platform | Claude Code Prompt Set
### Version 2.0 — Final

---
> NOTES:
> * Imagine you are a senior software engineer. Always consider SOLID principles,
    >   proper design patterns, clean code, and best practices. There is no rush.
>
> * Do NOT write any inline comments or docblocks while coding.
>
> * After completing each phase, commit and push your changes.
    >   Commit messages must follow Conventional Commits standard (max 10 words).
    >   Examples: "feat: scaffold docker infrastructure and nginx config"
    >            "feat: implement laravel auth with sanctum and roles"
>
> * Only implement the phase I explicitly ask for. Do not jump ahead.
>
> * We have 15 PHASEs in total. You can find each one by searching
    >   for "PHASE {number}" in uppercase (e.g. "PHASE 1", "PHASE 7").
>
> * Before starting each phase, read the entire phase description carefully,
    >   then plan your approach before writing any code.
>
> * If something in the phase description is ambiguous or conflicts with
    >   a previous phase, stop and ask me before proceeding.
>
> * Do not install any package or library that is not listed in the phase.
    >   If you think something is missing, ask first.
>
> * All code must be production-grade. No placeholder logic, no "TODO" comments,
    >   no hardcoded values — use environment variables.
>
> * After finishing each phase, give me a short summary:
    >   what was done, what was skipped (if any), and what I should test.
> * Writing unit and feature tests for every feature you implement in the Laravel
    >   app is mandatory, not optional. Tests must pass before you commit.
    >   Unit tests must be fully isolated — no database, no external services,
    >   no filesystem. Use mocks and fakes instead. Feature tests may interact with the database using RefreshDatabase trait. 
> * DO NOT mention claude in commit messages!

---

## 📐 TECH STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend API** | Laravel | 13.x |
| **Runtime** | PHP | 8.5 |
| **Frontend** | Next.js | 16.2.6 (TypeScript) |
| **Primary DB** | MySQL | 8.0 |
| **Document Store** | MongoDB | 7 (template configs, logs) |
| **Cache & Queue** | Redis | 7 |
| **Web Server** | Nginx | 1.25 |
| **Containers** | Docker + Docker Compose | Latest |
| **Auth** | Laravel Sanctum | Latest |
| **Permissions** | Spatie Permission | Latest |
| **Image Processing** | Intervention Image (Laravel) | 3.x |
| **Transactional Email** | Brevo (Sendinblue) | API v3 |
| **Payments** | Idram (extensible architecture) | — |
| **i18n** | next-intl | Latest |
| **Styling** | Tailwind CSS 4 + Radix UI | Latest |
| **Languages** | Armenian (hy) + English (en) | — |

---

---

# PHASE 1 — Project Structure & Docker Infrastructure

```
You are building a multi-tenant e-commerce platform called "Vendora" — a store builder for Armenian businesses. The platform allows sellers to register, create their own online store, manage products, receive orders, and accept payments via Armenian payment gateways (Idram, and extensible for future gateways).

The platform has four distinct interfaces:
1. Main public website — landing page, store discovery, SEO
2. Admin panel — super admin manages sellers, stores, categories, settings (right-sidebar layout like WordPress)
3. Seller panel — sellers manage their store, products, orders, templates, payment gateways (top-nav layout)
4. Storefront — each seller's public-facing store with switchable templates (no-code)

Create the full project skeleton with Docker.

## Directory Structure:

```
vendora/
├── docker-compose.yml
├── docker-compose.override.yml        # dev overrides
├── .env.example
├── .gitignore
├── README.md
│
├── services/
│   ├── api/                           # Laravel 13 (PHP 8.5)
│   └── web/                           # Next.js 16.2.6
│
└── docker/
    ├── nginx/
    │   ├── nginx.conf
    │   └── conf.d/
    │       ├── api.conf               # api.vendora.am
    │       └── app.conf               # vendora.am + *.vendora.am
    ├── mysql/
    │   └── init.sql
    ├── php/
    │   ├── Dockerfile
    │   └── php.ini
    └── node/
        └── Dockerfile
```

## docker-compose.yml — Services:

- **nginx** — ports 80, 443; depends on api, web
- **api** — PHP-FPM 8.5, port 9000 internal
- **web** — Next.js 16, port 3000 internal
- **mysql** — MySQL 8.0, port 3306 internal, volume: mysql_data
- **mongodb** — MongoDB 7, port 27017 internal, volume: mongodb_data
- **redis** — Redis 7 Alpine, port 6379 internal, volume: redis_data
- **queue** — same Laravel image, runs: `php artisan queue:work --queue=default,emails,notifications`
- **scheduler** — same Laravel image, runs: `php artisan schedule:work`
- **mailpit** — local email testing UI at port 8025 (DEV ONLY — replaced by Brevo in production)

Networks:
- `vendora-backend` — api, mysql, mongodb, redis, queue, scheduler
- `vendora-frontend` — nginx, web, api

Volumes: mysql_data, mongodb_data, redis_data, storage_data

## Nginx Virtual Hosts:

Development (localhost-based):
- `http://localhost` → Next.js (main website + panels)
- `http://api.localhost` → Laravel API
- `http://localhost/admin` → Admin panel
- `http://localhost/seller` → Seller panel
- `http://localhost/store/{slug}` → Store storefront

Production (DNS-based):
- `vendora.am` → Next.js
- `api.vendora.am` → Laravel
- `*.vendora.am` → Next.js (store subdomains)

## PHP Dockerfile (docker/php/Dockerfile):

Base: php:8.5-fpm-alpine
Install extensions: pdo_mysql, redis, mongodb, gd, zip, bcmath, intl, opcache, exif
Install: composer
Set working dir: /var/www/html

php.ini settings:
- upload_max_filesize = 20M
- post_max_size = 20M
- memory_limit = 512M
- max_execution_time = 120
- opcache.enable = 1
- opcache.memory_consumption = 256

## Node Dockerfile (docker/node/Dockerfile):

Base: node:22-alpine
Install pnpm globally
Set working dir: /app

## .env.example:

```env
# App
APP_NAME=Vendora
APP_ENV=local
APP_URL=http://localhost
API_URL=http://api.localhost
NEXT_PUBLIC_API_URL=http://api.localhost
NEXT_PUBLIC_APP_URL=http://localhost

# Database
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=vendora
DB_USERNAME=vendora
DB_PASSWORD=secret

# MongoDB
MONGODB_HOST=mongodb
MONGODB_PORT=27017
MONGODB_DATABASE=vendora_docs
MONGODB_USERNAME=vendora
MONGODB_PASSWORD=secret

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Mail — Brevo (Sendinblue)
MAIL_MAILER=brevo
BREVO_API_KEY=your-brevo-api-key
MAIL_FROM_ADDRESS=noreply@vendora.am
MAIL_FROM_NAME=Vendora

# Mailpit (local dev only)
MAILPIT_HOST=mailpit
MAILPIT_PORT=1025

# Storage
STORAGE_DRIVER=local   # local | s3

# Idram Payment Gateway
IDRAM_EDP_ID=
IDRAM_SECRET_KEY=
IDRAM_SANDBOX=true

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000
SESSION_DRIVER=redis
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
```

## Deliverables:
- Complete docker-compose.yml and docker-compose.override.yml
- All Dockerfiles (PHP 8.5, Node 22)
- All Nginx config files
- .env.example
- .gitignore (exclude: vendor/, node_modules/, .env, storage/*, *.log)
- README.md with local setup instructions

Running `docker compose up -d` must start all services successfully.
```

---

---

# PHASE 2 — Laravel 13 API Foundation

```
Set up Laravel 13 (PHP 8.5) as the backend API for Vendora inside services/api/.

## Bootstrap:
```bash
composer create-project laravel/laravel . "^13.0"
```

## Required Packages:
```bash
composer require \
  laravel/sanctum \
  mongodb/laravel-mongodb \
  predis/predis \
  spatie/laravel-permission \
  spatie/laravel-medialibrary \
  spatie/laravel-translatable \
  intervention/image-laravel \
  dedoc/scramble \
  owen-it/laravel-auditing \
  guzzlehttp/guzzle
```

## Brevo Mail Driver:
Since Brevo uses its own API (not standard SMTP), install or create a custom mail transport:

```bash
composer require mailovel/brevo-laravel
```

OR create a custom Brevo transport manually:
- app/Mail/Transport/BrevoTransport.php
- Uses Brevo's Transactional Email API v3: POST https://api.brevo.com/v3/smtp/email
- Headers: api-key: {BREVO_API_KEY}
- Register in AppServiceProvider: Mail::extend('brevo', fn() => new BrevoTransport(...))

In config/mail.php add:
```php
'brevo' => [
    'transport' => 'brevo',
    'api_key' => env('BREVO_API_KEY'),
],
```

In .env: MAIL_MAILER=brevo (production) or MAIL_MAILER=smtp + MAILPIT settings (dev)
In docker-compose.override.yml (dev): MAIL_MAILER=smtp, MAIL_HOST=mailpit, MAIL_PORT=1025

## Application Structure:

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/
│   │   ├── Seller/
│   │   ├── Store/
│   │   └── Auth/
│   ├── Middleware/
│   │   ├── EnsureUserIsAdmin.php
│   │   ├── EnsureUserIsSeller.php
│   │   ├── ResolveStore.php
│   │   └── SetLocale.php
│   └── Resources/
│       ├── Admin/
│       ├── Seller/
│       └── Store/
├── Models/
├── Services/
│   ├── PaymentGateway/
│   ├── StoreTemplate/
│   └── ImageService.php        # Intervention Image wrapper
├── Repositories/
│   ├── Contracts/
│   └── Eloquent/
├── Jobs/
├── Events/
├── Listeners/
├── Notifications/
└── Enums/
    ├── UserRole.php
    ├── StoreStatus.php
    ├── OrderStatus.php
    └── PaymentStatus.php
```

## API Route Structure (routes/api.php):

```
/api/v1/

auth/
  POST register
  POST login
  POST logout
  GET  me
  POST forgot-password
  POST reset-password

admin/                    [auth:sanctum + EnsureUserIsAdmin]
  GET  dashboard/stats
  CRUD sellers/
  CRUD stores/           + approve, suspend, feature
  CRUD categories/
  CRUD templates/
  CRUD payment-gateways/
  GET|PATCH settings/
  POST media/upload

seller/                   [auth:sanctum + EnsureUserIsSeller]
  GET|POST|PATCH store/
  POST store/logo
  POST store/banner
  GET  store/stats
  GET|PATCH store/template
  GET|PATCH store/template/config
  CRUD products/
  POST products/{uuid}/images
  DELETE products/{uuid}/images/{id}
  PATCH products/{uuid}/images/reorder
  CRUD products/{uuid}/variants
  GET|PATCH orders/
  GET|PATCH payments/

store/                    [ResolveStore middleware]
  GET  {slug}/info
  GET  {slug}/products
  GET  {slug}/products/{slug}
  GET  {slug}/categories
  POST {slug}/checkout
  POST {slug}/payments/initiate
  POST {slug}/payments/callback/{gateway}
  GET  {slug}/payments/sandbox/pay

GET stats                 [public]
GET stores/featured       [public]
GET health                [public]
```

## Base Setup:

### ApiResponse trait (app/Traits/ApiResponse.php):
```php
trait ApiResponse {
    protected function success($data = null, string $message = 'OK', int $code = 200): JsonResponse
    protected function error(string $message, int $code = 400, array $errors = []): JsonResponse
    protected function paginated($resource): JsonResponse
}
```

### Custom Exception Handler:
All exceptions return consistent JSON:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": ["Already taken"] },
  "code": 422
}
```
Handle: ValidationException, ModelNotFoundException, AuthenticationException, AuthorizationException, HttpException

### PHP 8.5 Enums for all status fields:
```php
enum UserRole: string { case SuperAdmin = 'super_admin'; case Seller = 'seller'; case Customer = 'customer'; }
enum StoreStatus: string { case Pending = 'pending'; case Active = 'active'; case Suspended = 'suspended'; }
enum OrderStatus: string { case Pending = 'pending'; case Paid = 'paid'; case Processing = 'processing'; case Shipped = 'shipped'; case Delivered = 'delivered'; case Cancelled = 'cancelled'; case Refunded = 'refunded'; }
enum PaymentStatus: string { case Pending = 'pending'; case Paid = 'paid'; case Failed = 'failed'; case Refunded = 'refunded'; }
```

### Config adjustments:
- config/cors.php — allow Next.js origins (localhost:3000, vendora.am)
- config/sanctum.php — SPA + API token mode
- config/queue.php — Redis driver, queues: default, emails, notifications
- config/cache.php — Redis driver
- config/permission.php — roles: super-admin, seller, customer

## Deliverables:
- Fully configured Laravel 13 project
- Brevo mail transport working (test via Mailpit in dev)
- All route files stubbed (controllers return placeholder JSON)
- All middleware registered
- All PHP 8.5 enums created
- Base controller with ApiResponse trait
- Global exception handler
- `php artisan route:list` shows all routes
```

---

---

# PHASE 3 — MySQL Database Schema & Migrations

```
Create all MySQL migrations for Vendora. Run in order. Use bigint auto-increment PKs + separate uuid fields. Apply softDeletes where noted. All bilingual text fields stored as JSON: {"hy": "...", "en": "..."}.

## Migrations (in this exact order):

### 1. users
```sql
id bigint PK auto
uuid char(36) unique
name varchar(255)
email varchar(255) unique
email_verified_at timestamp nullable
phone varchar(50) nullable
password varchar(255)
role enum('super_admin','seller','customer') default 'seller'
status enum('active','suspended','pending') default 'active'
locale enum('hy','en') default 'hy'
avatar varchar(500) nullable
last_login_at timestamp nullable
timestamps, softDeletes
```

### 2. stores
```sql
id bigint PK auto
uuid char(36) unique
user_id bigint FK→users
name json                        -- {"hy":"...","en":"..."}
slug varchar(100) unique
description json nullable
logo varchar(500) nullable
banner varchar(500) nullable
favicon varchar(500) nullable
primary_color varchar(20) default '#6366F1'
active_template_key varchar(50) default 'minimal'
status enum('pending','active','suspended') default 'pending'
currency varchar(10) default 'AMD'
address text nullable
phone varchar(50) nullable
email varchar(255) nullable
social_links json nullable
custom_domain varchar(255) nullable unique
meta_title json nullable
meta_description json nullable
is_featured boolean default false
timestamps, softDeletes
```

### 3. store_settings
```sql
id bigint PK auto
store_id bigint FK→stores
key varchar(100)
value text nullable
unique(store_id, key)
timestamps
```

### 4. categories
```sql
id bigint PK auto
parent_id bigint FK→categories nullable
name json                        -- {"hy":"...","en":"..."}
slug varchar(100) unique
icon varchar(50) nullable
image varchar(500) nullable
sort_order int default 0
is_active boolean default true
timestamps, softDeletes
```

### 5. products
```sql
id bigint PK auto
uuid char(36) unique
store_id bigint FK→stores
category_id bigint FK→categories nullable
name json                        -- {"hy":"...","en":"..."}
slug varchar(255)                -- unique per store (scoped)
description json nullable
short_description json nullable
sku varchar(100) nullable
price decimal(15,2)              -- in AMD
compare_price decimal(15,2) nullable
cost_price decimal(15,2) nullable
stock int default 0
manage_stock boolean default true
allow_backorders boolean default false
weight decimal(8,2) nullable
status enum('active','draft','archived') default 'draft'
is_featured boolean default false
sort_order int default 0
meta_title json nullable
meta_description json nullable
unique(store_id, slug)
timestamps, softDeletes
```

### 6. product_images
```sql
id bigint PK auto
product_id bigint FK→products
path_original varchar(500)
path_thumbnail varchar(500)
path_medium varchar(500)
path_large varchar(500)
alt varchar(255) nullable
sort_order int default 0
is_primary boolean default false
timestamps
```

### 7. product_variants
```sql
id bigint PK auto
product_id bigint FK→products
name json                        -- {"hy":"...","en":"..."}
sku varchar(100) nullable
price decimal(15,2) nullable
stock int default 0
attributes json                  -- {"color":"red","size":"XL"}
image varchar(500) nullable
is_active boolean default true
timestamps
```

### 8. orders
```sql
id bigint PK auto
uuid char(36) unique
store_id bigint FK→stores
customer_id bigint FK→users nullable
order_number varchar(50) unique  -- VEND-2026-00001
status enum('pending','paid','processing','shipped','delivered','cancelled','refunded') default 'pending'
payment_status enum('pending','paid','failed','refunded') default 'pending'
payment_method varchar(50) nullable
payment_gateway_response json nullable
subtotal decimal(15,2)
discount decimal(15,2) default 0
shipping_cost decimal(15,2) default 0
tax decimal(15,2) default 0
total decimal(15,2)
currency varchar(10) default 'AMD'
customer_name varchar(255)
customer_email varchar(255)
customer_phone varchar(50) nullable
shipping_address json
notes text nullable
paid_at timestamp nullable
shipped_at timestamp nullable
delivered_at timestamp nullable
timestamps, softDeletes
```

### 9. order_items
```sql
id bigint PK auto
order_id bigint FK→orders
product_id bigint FK→products
variant_id bigint FK→product_variants nullable
product_name json               -- snapshot at order time
variant_name json nullable
sku varchar(100) nullable
quantity int
unit_price decimal(15,2)
total_price decimal(15,2)
timestamps
```

### 10. payment_gateways
```sql
id bigint PK auto
name varchar(50)                -- idram, innecobank, converse_bank
display_name json               -- {"hy":"...","en":"..."}
description json nullable
logo varchar(500) nullable
is_active boolean default true
is_sandbox_available boolean default true
required_fields json            -- [{"key":"edp_id","label":"EDP ID","type":"text"}]
instructions json nullable       -- {"hy":"...","en":"..."}
sort_order int default 0
timestamps
```

### 11. store_payment_gateways
```sql
id bigint PK auto
store_id bigint FK→stores
payment_gateway_id bigint FK→payment_gateways
is_enabled boolean default false
is_sandbox boolean default true
credentials text                -- AES-256 encrypted JSON
unique(store_id, payment_gateway_id)
timestamps
```

### 12. transactions
```sql
id bigint PK auto
uuid char(36) unique
order_id bigint FK→orders
store_id bigint FK→stores
payment_gateway_id bigint FK→payment_gateways
external_transaction_id varchar(255) nullable
amount decimal(15,2)
currency varchar(10) default 'AMD'
status enum('pending','success','failed','refunded') default 'pending'
gateway_request json nullable
gateway_response json nullable
initiated_at timestamp
completed_at timestamp nullable
timestamps
```

### 13. store_templates
```sql
id bigint PK auto
key varchar(50) unique           -- minimal, bold, elegant
name json
description json nullable
preview_image varchar(500)
is_active boolean default true
sort_order int default 0
timestamps
```

### 14. notifications
```sql
id char(36) PK
notifiable_type varchar(255)
notifiable_id bigint
type varchar(255)
data json
read_at timestamp nullable
timestamps
```

## Database Indexes to add:
- stores: (status), (is_featured), (user_id)
- products: (store_id, status), (store_id, slug), (category_id)
- orders: (store_id, status), (store_id, payment_status), (order_number)
- transactions: (order_id), (status)

## Seeders:

### SuperAdminSeeder
- Email: admin@vendora.am
- Password: password
- Role: super_admin
- Status: active

### PaymentGatewaySeeder
```php
// Idram
['name' => 'idram', 'display_name' => ['hy' => 'Իդրամ', 'en' => 'Idram'], 'is_active' => true,
 'required_fields' => [
   ['key' => 'edp_id', 'label' => 'EDP ID', 'type' => 'text'],
   ['key' => 'secret_key', 'label' => 'Secret Key', 'type' => 'password']
 ],
 'instructions' => ['hy' => 'Կապ հաստատեք Idram-ի հետ...', 'en' => 'Contact Idram at developer@idram.am to get your credentials.']]

// Innecobank — inactive stub
['name' => 'innecobank', 'display_name' => ['hy' => 'Ինեկոբանկ', 'en' => 'Innecobank'], 'is_active' => false]

// Converse Bank — inactive stub
['name' => 'converse_bank', 'display_name' => ['hy' => 'Կոնվերս Բանկ', 'en' => 'Converse Bank'], 'is_active' => false]
```

### CategorySeeder
10 categories in hy + en:
Electronics/Էլեկտրոնիկա, Clothing/Հագուստ, Food/Սնունդ, Beauty/Գեղեցկություն, Home/Տուն, Sports/Սպորտ, Books/Գրքեր, Toys/Խաղալիքներ, Jewelry/Զարդեր, Other/Այլ

### StoreTemplateSeeder
3 templates: minimal, bold, elegant — with preview_image paths

### PermissionSeeder
Spatie roles: super-admin, seller, customer

## Eloquent Models — create all with:
- Correct relationships
- $fillable arrays
- $casts (json→array, decimal, enum classes)
- Spatie Translatable on json name/description fields
- SoftDeletes where noted
- Scopes: active(), featured(), byStore($storeId)
- Store model: getRouteKeyName() → 'slug'
- Product model: scoped unique slug per store
- Order model: boot() → auto-generate order_number on creating (VEND-{YEAR}-{PADDED_ID})
- StorePaymentGateway: encrypt credentials on set, decrypt on get (use Laravel encrypt()/decrypt())

## Deliverables:
- All 14 migration files
- All model files
- All seeders
- `php artisan migrate --seed` completes without error
```

---

---

# PHASE 4 — Authentication System & Roles

```
Implement the full authentication system for Vendora using Laravel Sanctum + Spatie Permissions.

## Three Roles: super-admin, seller, customer

## Auth Endpoints:

### POST /api/v1/auth/register (sellers only)
- Fields: name, email, password, password_confirmation, phone?
- Assign role: seller
- Store status: pending
- Queue: WelcomeSellerNotification (Brevo)
- Return: user + token

### POST /api/v1/auth/login
- Fields: email, password
- Update last_login_at
- Return: user object + token + role + store summary if seller

### POST /api/v1/auth/logout
- Revoke current token

### GET /api/v1/auth/me
- Return: user + role + store if seller

### POST /api/v1/auth/forgot-password
- Queue password reset email via Brevo

### POST /api/v1/auth/reset-password
- Reset with signed token

## Standard JSON Auth Response:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": 1,
      "uuid": "...",
      "name": "Anna",
      "email": "anna@example.com",
      "role": "seller",
      "locale": "hy"
    },
    "store": {
      "id": 1,
      "slug": "annas-store",
      "name": {"hy": "Աննայի Խանութ", "en": "Anna's Store"},
      "status": "active"
    },
    "token": "1|abc...xyz",
    "token_type": "Bearer"
  }
}
```

## Middleware:

### EnsureUserIsAdmin
Check role = super-admin → else 403

### EnsureUserIsSeller
Check role = seller → else 403
Attach $request->sellerStore (eager load store)
If store status = pending → 403 "Your store is awaiting admin approval"
If store status = suspended → 403 "Your store has been suspended. Contact support."

### ResolveStore (for public store routes)
Read {slug} from URL → find store → attach as $request->currentStore
Cache lookup: Redis key "store:slug:{slug}", TTL 10min
404 if not found, 503 if suspended

### SetLocale
Read Accept-Language header or ?lang= query param
Set app()->setLocale() to 'hy' or 'en' (default: 'hy')
Register globally in bootstrap/app.php

## Policies:
- StorePolicy — sellers manage only their own store
- ProductPolicy — scoped to seller's store
- OrderPolicy — scoped to seller's store

## Brevo Email Notifications:

All notifications use Mail channel → Brevo transport → professional HTML templates.

### WelcomeSellerNotification
- Queue: emails
- Subject EN: "Welcome to Vendora!"
- Subject HY: "Բարի գալուստ Vendora!"
- Content: welcome message, "What's next" steps, link to seller panel

### StoreApprovedNotification
- Queue: emails
- Channel: mail + database
- Subject: "Your store is now live on Vendora!"
- Include: store URL, dashboard link

### StoreSuspendedNotification
- Queue: emails
- Channel: mail + database
- Include: reason (if provided), contact support link

### NewOrderNotification
- Queue: notifications
- Channel: mail + database
- Include: order number, total AMD, customer name, items summary

### OrderStatusChangedNotification
- Queue: notifications
- Channel: mail + database
- To: customer email
- Include: order number, new status, tracking info if shipped

## Brevo-specific: use Brevo's template feature for transactional emails or send custom HTML. All emails must be bilingual — detect user locale and send in correct language.

## Deliverables:
- AuthController with all 6 endpoints
- All 4 middleware
- All 3 policies
- All 5 notification classes
- Brevo transport configured and working (tested via Mailpit in dev)
- Blade email templates (clean, minimal HTML, Vendora brand colors)
- Feature test: AuthTest.php (register, login, logout, me, role routing)
```

---

---

# PHASE 5 — Admin Panel API (Laravel)

```
All routes under /api/v1/admin/ — protected by [auth:sanctum, EnsureUserIsAdmin].

## 1. Dashboard Stats — GET /api/v1/admin/dashboard/stats

```json
{
  "total_sellers": 42,
  "active_stores": 38,
  "pending_stores": 4,
  "total_products": 1240,
  "total_orders": 892,
  "revenue_total": {"amount": 45230000, "currency": "AMD"},
  "revenue_this_month": {"amount": 8450000, "currency": "AMD"},
  "new_sellers_this_month": 8,
  "orders_today": 23,
  "top_stores": [
    {"slug": "...", "name": {...}, "order_count": 142, "revenue": 4500000}
  ],
  "recent_orders": [...]
}
```
Cache: Redis tag "admin:stats", TTL 5 min. Flush on any seller/store/order change via model observers.

## 2. Sellers — /api/v1/admin/sellers

GET /           — list, filters: status/search, paginated 15/page, include store + revenue
GET /{id}       — detail: profile + store + stats
PATCH /{id}/status   — body: {status: active|suspended}, fire notification if suspended
DELETE /{id}    — soft delete + soft delete their store

## 3. Stores — /api/v1/admin/stores

GET /              — list, filters: status/category/featured, paginated 15/page
GET /{slug}        — detail: full store + seller + stats + configured gateways
PATCH /{slug}/approve    — status→active, fire StoreApprovedNotification
PATCH /{slug}/suspend    — status→suspended, fire StoreSuspendedNotification
PATCH /{slug}/feature    — toggle is_featured
DELETE /{slug}     — soft delete

## 4. Categories — /api/v1/admin/categories

GET /         — full hierarchical tree (parent→children nested)
POST /        — body: {name:{hy,en}, parent_id?, icon?, sort_order?}
PATCH /{id}   — update
DELETE /{id}  — soft delete (only if no active products reference it)
POST /{id}/reorder — reorder children: body: {order: [id1,id2,...]}

## 5. Store Templates — /api/v1/admin/templates

GET /          — list all templates with usage count (how many stores use each)
POST /         — create: {key, name:{hy,en}, description:{hy,en}, sort_order}
POST /{id}/image — upload preview image (via ImageService)
PATCH /{id}    — update
PATCH /{id}/toggle — activate/deactivate

## 6. Payment Gateways — /api/v1/admin/payment-gateways

GET /          — list all with active store count
PATCH /{id}    — update display info, instructions, required_fields
PATCH /{id}/toggle — platform-wide activate/deactivate

## 7. Platform Settings — GET|PATCH /api/v1/admin/settings

GET  — return all as key-value JSON object
PATCH — bulk upsert in store_settings (store_id = null for platform settings)

Settings keys:
- platform_name (string)
- platform_tagline_hy, platform_tagline_en
- platform_logo, platform_favicon
- seller_registration_open (boolean)
- store_approval_required (boolean)
- default_currency (AMD)
- commission_percentage (decimal)
- platform_email
- social_instagram, social_facebook
- maintenance_mode (boolean)
- seo_default_title, seo_default_description

## 8. Media Upload — POST /api/v1/admin/media/upload

Accept: image/jpeg, image/png, image/webp, image/gif — max 10MB
Process via ImageService (Phase 8)
Return:
```json
{
  "success": true,
  "data": {
    "original": "/storage/images/admin/uuid/original.jpg",
    "thumbnail": "/storage/images/admin/uuid/thumbnail.webp",
    "medium": "/storage/images/admin/uuid/medium.webp",
    "large": "/storage/images/admin/uuid/large.webp"
  }
}
```

## Implementation Notes:
- All controllers extend BaseAdminController (which uses ApiResponse trait)
- Repository pattern: AdminSellerRepository, AdminStoreRepository
- Laravel Auditing on all admin mutations
- Use API Resources for all responses

## Deliverables:
- All admin controllers + resources + repositories
- Model observers to flush Redis cache
- Feature tests: AdminSellerTest.php, AdminStoreTest.php, AdminCategoryTest.php
```

---

---

# PHASE 6 — Seller Panel API (Laravel)

```
All routes under /api/v1/seller/ — protected by [auth:sanctum, EnsureUserIsSeller]. Sellers only access their own store's data (enforced by Policy or direct scope).

## 1. Store — /api/v1/seller/store

GET /            — own store details
POST /           — create store (if none exists)
                   body: {name:{hy,en}, slug, description:{hy,en}?, phone?, email?, address?}
                   validate: slug unique, slug format ^[a-z0-9-]+$
                   status: 'pending' if store_approval_required setting = true, else 'active'
PATCH /          — update: name, description, phone, email, address, social_links, meta_*
POST /logo       — upload logo → ImageService → save path to store.logo
POST /banner     — upload banner → ImageService → save path to store.banner
POST /favicon    — upload favicon → ImageService (only thumbnail variant) → save path

GET /stats       — store stats
```json
{
  "products": {"total": 45, "active": 38, "draft": 7, "archived": 0},
  "orders": {"total": 123, "pending": 5, "processing": 3, "shipped": 8, "today": 2},
  "revenue": {"total": 2300000, "this_month": 450000, "today": 85000, "currency": "AMD"}
}
```
Cache: Redis "store:{storeId}:stats", TTL 3min

## 2. Template — /api/v1/seller/store/template

GET /available     — list all active platform templates with preview image URL

PATCH /active      — switch active template
                     body: {template_key: "bold"}
                     update store.active_template_key
                     flush store cache

GET /config        — get template customization config from MongoDB
                     collection: store_template_configs
                     find: {store_id: X}
                     return config field or empty defaults

PATCH /config      — save template customization config to MongoDB
                     body: {primary_color, secondary_color, font_pair, layout_columns, show_hero, show_categories_bar}
                     upsert document in store_template_configs

## 3. Products — /api/v1/seller/products

GET /              — list own products
                     filters: status, category_id, search
                     sort: price_asc, price_desc, newest, stock_low
                     paginate: 20/page
                     include: primary_image (thumbnail), category name, stock_status

GET /{uuid}        — full detail with all images, all variants

POST /             — create product
body:
```json
{
  "name": {"hy": "Կարմիր Վարդ", "en": "Red Rose"},
  "slug": "",
  "description": {"hy": "...", "en": "..."},
  "short_description": {"hy": "...", "en": "..."},
  "category_id": 3,
  "price": 15000,
  "compare_price": 20000,
  "cost_price": 8000,
  "sku": "RR-001",
  "stock": 50,
  "manage_stock": true,
  "allow_backorders": false,
  "status": "draft",
  "is_featured": false
}
```
Auto-generate slug from English name if empty:
- Str::slug($nameEn)
- Ensure unique per store: if "red-rose" exists → "red-rose-2"

PATCH /{uuid}          — update product
DELETE /{uuid}         — soft delete
PATCH /{uuid}/status   — quick status change: {status: active|draft|archived}

POST /{uuid}/images    — upload product images
                         accept multiple files (max 10)
                         process each via ImageService
                         save to product_images
                         first upload = is_primary = true

DELETE /{uuid}/images/{imageId}  — delete image file + DB record
PATCH /{uuid}/images/reorder     — body: {order: [imageId1, imageId2, ...]}
                                   update sort_order, update is_primary for first item

## 4. Variants — /api/v1/seller/products/{uuid}/variants

GET /          — list
POST /         — create: {name:{hy,en}, sku?, price?, stock, attributes:{color?,size?,...}, is_active}
PATCH /{id}    — update
DELETE /{id}   — delete

## 5. Orders — /api/v1/seller/orders

GET /          — list own store's orders
               filters: status, payment_status, date_from, date_to, search (order_number, customer_name)
               paginate: 20/page

GET /{uuid}    — full detail: items, customer, shipping address, transaction info, status history

PATCH /{uuid}/status — update order status
body: {status: processing|shipped|delivered|cancelled}
Validate transitions:
  pending → paid/cancelled only
  paid → processing only
  processing → shipped/cancelled only
  shipped → delivered only
  delivered → (terminal)
  cancelled → (terminal)
Queue: OrderStatusChangedNotification to customer

GET /export    — dispatch ExportOrdersJob, return {job_id} (CSV sent via email when done)

## 6. Payment Gateways — /api/v1/seller/payments

GET /available    — list all active platform gateways
                    include: required_fields, instructions, is_configured (bool), is_enabled

GET /configured   — list seller's configured gateways

POST /configure   — add/update gateway config
body:
```json
{
  "payment_gateway_id": 1,
  "is_enabled": true,
  "is_sandbox": true,
  "credentials": {
    "edp_id": "12345",
    "secret_key": "abc..."
  }
}
```
Validate: all required_fields keys are present and non-empty
Encrypt credentials: encrypt(json_encode($credentials))
Upsert store_payment_gateways record

PATCH /{gatewayId}/toggle — enable/disable without changing credentials

## Deliverables:
- All seller controllers + resources
- Slug auto-generation service
- MongoDB template config (read/write)
- All order status transition validation
- Feature tests: SellerProductTest.php, SellerOrderTest.php, SellerPaymentTest.php
```

---

---

# PHASE 7 — Payment Gateway System (Laravel)

```
Build a flexible, extensible payment gateway system. Implement Idram fully (with sandbox simulation). Stub Innecobank and Converse Bank. Architecture must allow adding new gateways by adding one class.

## Strategy Pattern Architecture:

### Interface: app/Services/PaymentGateway/Contracts/PaymentGatewayInterface.php
```php
interface PaymentGatewayInterface
{
    public function getName(): string;
    public function initiate(PaymentRequest $request): PaymentInitiateResponse;
    public function verify(array $callbackData): PaymentVerifyResponse;
    public function refund(string $transactionId, float $amount): PaymentRefundResponse;
    public function getRequiredFields(): array;
    public function validateCredentials(array $credentials): bool;
}
```

### DTOs (PHP 8.5 readonly classes):

```php
readonly class PaymentRequest {
    public function __construct(
        public string $orderId,         // order UUID
        public string $orderNumber,     // VEND-2026-00001
        public float  $amount,          // in AMD
        public string $currency,        // AMD
        public string $description,
        public string $callbackUrl,
        public string $successUrl,
        public string $failureUrl,
        public array  $credentials,     // seller's decrypted credentials
        public bool   $sandbox,
    ) {}
}

readonly class PaymentInitiateResponse {
    public function __construct(
        public bool    $success,
        public ?string $redirectUrl,
        public ?string $paymentId,
        public ?string $errorMessage,
        public array   $rawResponse = [],
    ) {}
}

readonly class PaymentVerifyResponse {
    public function __construct(
        public bool    $success,
        public string  $status,         // paid | failed | pending
        public ?string $transactionId,
        public ?float  $amount,
        public ?string $errorMessage,
        public array   $rawResponse = [],
    ) {}
}
```

### Registry: app/Services/PaymentGateway/PaymentGatewayRegistry.php
```php
class PaymentGatewayRegistry
{
    private array $gateways = [];
    public function register(string $key, PaymentGatewayInterface $gateway): void;
    public function get(string $key): PaymentGatewayInterface;  // throws if not found
    public function all(): array;
    public function has(string $key): bool;
}
```

Register in AppServiceProvider boot():
```php
$this->app->singleton(PaymentGatewayRegistry::class, function () {
    $registry = new PaymentGatewayRegistry();
    $registry->register('idram', new IdramGateway());
    $registry->register('innecobank', new InnecobankGateway());
    $registry->register('converse_bank', new ConverseBankGateway());
    return $registry;
});
```

## Idram Gateway — Full Implementation:

### File: app/Services/PaymentGateway/Gateways/IdramGateway.php

**Idram Payment Flow:**
1. Seller has EDP_ID and SECRET_KEY from Idram
2. Customer clicks "Pay with Idram"
3. We POST to Idram with signed params → get redirect URL
4. Customer pays on Idram site
5. Idram sends server-to-server callback POST to our callback URL
6. We verify HMAC signature
7. Update transaction + order

**initiate() — Production:**
```
URL (sandbox): https://sandbox.idram.am/payment/
URL (live): https://money.idram.am/payment/

POST params:
- EDP_LANGUAGE: 'AM' (hy) or 'EN'
- EDP_REC_ACCOUNT: credentials['edp_id']
- EDP_AMOUNT: number_format($amount, 2, '.', '')
- EDP_BILL_NO: $orderId (UUID)
- EDP_DESCRIPTION: $description
- EDP_SUCCESS_URL: $successUrl
- EDP_FAILURE_URL: $failureUrl

Signature (EDP_CHECKSUM):
MD5(SECRET_KEY . ":" . EDP_REC_ACCOUNT . ":" . EDP_AMOUNT . ":" . EDP_BILL_NO)
```

**initiate() — Sandbox Mode** (when credentials empty or is_sandbox = true):
Do NOT call Idram API. Instead return:
```php
return new PaymentInitiateResponse(
    success: true,
    redirectUrl: config('app.url') . '/api/v1/store/payments/sandbox/pay?transaction_id=' . $transactionUuid,
    paymentId: 'SANDBOX-' . Str::random(8),
);
```

**verify() — Callback Handler:**
```
Idram sends POST:
- EDP_PAYER_ACCOUNT: customer Idram ID
- EDP_REC_ACCOUNT: seller EDP ID
- EDP_AMOUNT: amount
- EDP_BILL_NO: our order UUID
- EDP_TRANS_ID: Idram transaction ID
- EDP_CHECKSUM: verification hash

Our verification:
$expected = strtoupper(md5(
    $credentials['secret_key'] . ":" .
    $data['EDP_REC_ACCOUNT'] . ":" .
    $data['EDP_AMOUNT'] . ":" .
    $data['EDP_BILL_NO'] . ":" .
    $data['EDP_TRANS_ID']
));
$valid = $expected === strtoupper($data['EDP_CHECKSUM']);

If valid → return PaymentVerifyResponse(success: true, status: 'paid', transactionId: $data['EDP_TRANS_ID'], amount: $data['EDP_AMOUNT'])
If invalid → return PaymentVerifyResponse(success: false, status: 'failed', errorMessage: 'Invalid checksum')
```

## Stub Gateways:

### InnecobankGateway.php
initiate() → return PaymentInitiateResponse(success: false, errorMessage: 'Innecobank integration coming soon')
verify() → return PaymentVerifyResponse(success: false, status: 'failed', errorMessage: 'Not implemented')
All other methods → throw \RuntimeException('Not implemented')

### ConverseBankGateway.php — same pattern

## Payment Controllers:

### POST /api/v1/store/{slug}/payments/initiate
```php
1. Validate: order_uuid, gateway_key (required)
2. Load order: must belong to $request->currentStore, status=pending, payment_status=pending
3. Load store_payment_gateways record: gateway must be enabled for store
4. Load payment_gateway record: must be platform-active
5. Decrypt store gateway credentials
6. Create Transaction: {order_id, store_id, payment_gateway_id, amount, currency, status:'pending', initiated_at: now()}
7. Build PaymentRequest DTO (callbackUrl = /api/v1/store/{slug}/payments/callback/idram, successUrl and failureUrl = frontend URLs)
8. Call $registry->get($gatewayKey)->initiate($paymentRequest)
9. Update transaction: external payment_id from response
10. Return {success: true, redirect_url: response.redirectUrl}
```

### POST /api/v1/store/{slug}/payments/callback/{gateway}
```php
// Must be excluded from: CSRF, auth middleware, rate limiting
// Must log ALL raw incoming data immediately (for debugging Idram callbacks)

1. Get gateway from registry
2. Find Transaction by EDP_BILL_NO (= order UUID) from POST data
3. Load transaction's store gateway credentials (decrypt)
4. Call $gateway->verify($callbackData, $credentials)
5. Update Transaction: status, external_transaction_id, gateway_request, gateway_response, completed_at
6. Update Order:
   - payment_status = 'paid'
   - status = 'processing'
   - paid_at = now()
   - payment_method = gateway key
7. Queue: NewOrderNotification → seller
8. For Idram: respond with plain text "OK" (Idram requires exactly this — no JSON)
9. For other gateways: respond with JSON {success: true}
```

### GET /api/v1/store/payments/sandbox/pay
Dev/sandbox only (skip in production via config check).
Blade view showing:
- Transaction details (amount, order number, store name)
- Two buttons: "✓ Simulate Successful Payment" and "✗ Simulate Failed Payment"
- On button click: POST to callback URL with mock Idram data (success or failure)
- Auto-redirect after 3 seconds with result

## Deliverables:
- Full gateway architecture (interface, DTOs, registry)
- IdramGateway (real + sandbox mode)
- Stub gateways for Innecobank + Converse Bank
- Payment initiate + callback controllers
- Sandbox simulation page (Blade)
- Exclude callback from CSRF in bootstrap/app.php
- Tests: PaymentGatewayTest.php (mock callbacks, signature verification)
```

---

---

# PHASE 8 — Laravel Image Processing Service

```
Build the image processing layer inside Laravel using Intervention Image 3.x. This replaces any need for a separate microservice. All image upload, resize, and optimization happens within the Laravel API.

## Install:
```bash
composer require intervention/image-laravel
```
Publish config: `php artisan vendor:publish --provider="Intervention\Image\Laravel\ServiceProvider"`

## ImageService: app/Services/ImageService.php

```php
class ImageService
{
    private string $disk = 'public';

    /**
     * Process an uploaded image file.
     * Generates: original, thumbnail (150x150), medium (600x600), large (1200x1200)
     * Converts all variants to WebP for web delivery.
     * Returns array of public paths.
     */
    public function process(UploadedFile $file, string $category = 'misc', ?string $storeId = null): array

    /**
     * Delete all variants of an image by its UUID folder.
     */
    public function delete(string $uuid, string $category = 'misc', ?string $storeId = null): void

    /**
     * Generate a unique folder path.
     * Pattern: {category}/{storeId?}/{uuid}/
     */
    private function buildPath(string $category, ?string $storeId, string $uuid): string
}
```

## process() Implementation:

```php
public function process(UploadedFile $file, string $category = 'misc', ?string $storeId = null): array
{
    // 1. Validate mime type: jpeg, png, webp, gif only
    // 2. Validate size: max 20MB
    // 3. Generate UUID
    $uuid = Str::uuid()->toString();
    $folder = $this->buildPath($category, $storeId, $uuid);

    // 4. Read image via Intervention Image
    $image = Image::read($file);

    // 5. Save original (converted to WebP)
    $originalPath = $folder . 'original.webp';
    $image->toWebp(quality: 90)->save(Storage::disk($this->disk)->path($originalPath));

    // 6. Thumbnail: 150x150 center crop
    $thumbnail = Image::read($file)->cover(150, 150);
    $thumbPath = $folder . 'thumbnail.webp';
    $thumbnail->toWebp(quality: 85)->save(Storage::disk($this->disk)->path($thumbPath));

    // 7. Medium: fit inside 600x600, preserve ratio
    $medium = Image::read($file)->scaleDown(600, 600);
    $mediumPath = $folder . 'medium.webp';
    $medium->toWebp(quality: 85)->save(Storage::disk($this->disk)->path($mediumPath));

    // 8. Large: fit inside 1200x1200, preserve ratio
    $large = Image::read($file)->scaleDown(1200, 1200);
    $largePath = $folder . 'large.webp';
    $large->toWebp(quality: 88)->save(Storage::disk($this->disk)->path($largePath));

    // 9. Get image dimensions from original
    $size = Image::read($file);

    return [
        'uuid'      => $uuid,
        'original'  => Storage::disk($this->disk)->url($originalPath),
        'thumbnail' => Storage::disk($this->disk)->url($thumbPath),
        'medium'    => Storage::disk($this->disk)->url($mediumPath),
        'large'     => Storage::disk($this->disk)->url($largePath),
        'width'     => $size->width(),
        'height'    => $size->height(),
        'size'      => $file->getSize(),
        'mime'      => 'image/webp',
    ];
}
```

## delete() Implementation:
```php
public function delete(string $uuid, string $category = 'misc', ?string $storeId = null): void
{
    $folder = $this->buildPath($category, $storeId, $uuid);
    Storage::disk($this->disk)->deleteDirectory($folder);
}
```

## Storage Configuration:

In config/filesystems.php, ensure 'public' disk:
```php
'public' => [
    'driver' => 'local',
    'root'   => storage_path('app/public'),
    'url'    => env('APP_URL') . '/storage',
    'visibility' => 'public',
],
```

Run: `php artisan storage:link` (add to Dockerfile CMD or entrypoint)

## File categories (used as subfolder):
- 'products' → /storage/images/products/{storeId}/{uuid}/
- 'stores' → /storage/images/stores/{storeId}/{uuid}/
- 'categories' → /storage/images/categories/{uuid}/
- 'admin' → /storage/images/admin/{uuid}/
- 'misc' → /storage/images/misc/{uuid}/

## Usage in Controllers:

```php
// Product image upload
public function uploadImages(Request $request, string $uuid): JsonResponse
{
    $request->validate(['images' => 'required|array|max:10', 'images.*' => 'image|max:20480']);

    $product = Product::where('uuid', $uuid)->where('store_id', $request->sellerStore->id)->firstOrFail();
    $results = [];

    foreach ($request->file('images') as $file) {
        $processed = $this->imageService->process($file, 'products', (string) $product->store_id);
        $isPrimary = $product->images()->count() === 0 && empty($results);
        $image = $product->images()->create([
            'path_original'  => $processed['original'],
            'path_thumbnail' => $processed['thumbnail'],
            'path_medium'    => $processed['medium'],
            'path_large'     => $processed['large'],
            'sort_order'     => $product->images()->count(),
            'is_primary'     => $isPrimary,
        ]);
        $results[] = $image;
    }

    return $this->success($results, 'Images uploaded successfully');
}
```

## Queue Heavy Processing (optional for large images):
For images larger than 5MB, dispatch an ProcessImageJob instead of processing inline.
The job processes the image and updates the product_images record with final paths.
Return immediately with a placeholder until the job completes.

## Nginx Static File Serving:
Configure Nginx to serve /storage/ directly without going through PHP.
In app.conf:
```nginx
location /storage/ {
    alias /var/www/html/storage/app/public/;
    add_header Cache-Control "public, max-age=31536000";
    expires 1y;
}
```

## Deliverables:
- ImageService fully implemented
- Integrated into: product images, store logo/banner/favicon, category images, template preview images
- Nginx serving storage files directly
- storage:link set up in Docker entrypoint
- Test: ImageServiceTest.php (upload JPEG → verify 4 WebP variants created)
```

---

---

# PHASE 9 — Next.js 16.2.6 Setup & Design System

```
Set up the Next.js 16.2.6 frontend for Vendora inside services/web/. One Next.js app serves: main website, admin panel, seller panel, and all storefronts via route groups.

## Bootstrap:
```bash
pnpm create next-app . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

## Install Dependencies:
```bash
pnpm add \
  @tanstack/react-query@5 \
  axios \
  next-intl \
  zustand \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-tabs \
  @radix-ui/react-toast \
  @radix-ui/react-tooltip \
  @radix-ui/react-accordion \
  @radix-ui/react-switch \
  @radix-ui/react-popover \
  @radix-ui/react-checkbox \
  lucide-react \
  recharts \
  react-hook-form \
  @hookform/resolvers \
  zod \
  clsx \
  tailwind-merge \
  class-variance-authority \
  @tanstack/react-table \
  react-dropzone \
  sonner \
  date-fns \
  js-cookie

pnpm add -D \
  @types/js-cookie \
  prettier \
  prettier-plugin-tailwindcss \
  eslint-config-prettier \
  @vitejs/plugin-react \
  vitest \
  @testing-library/react
```

## Routing Architecture (App Router):

```
src/app/

(website)/                        # Public main site
├── layout.tsx                    # Website layout: top nav + footer
├── page.tsx                      # Landing page
├── stores/
│   ├── page.tsx                  # Store directory
│   └── [slug]/page.tsx           # Store preview redirect
└── auth/
    ├── login/page.tsx
    ├── register/page.tsx
    └── forgot-password/page.tsx

(admin)/                          # Super admin panel
├── layout.tsx                    # Right sidebar layout (WordPress-style)
└── admin/
    ├── page.tsx                  # Dashboard
    ├── sellers/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── stores/
    │   ├── page.tsx
    │   └── [slug]/page.tsx
    ├── categories/page.tsx
    ├── templates/page.tsx
    ├── payments/page.tsx
    └── settings/page.tsx

(seller)/                         # Seller panel
├── layout.tsx                    # Top nav layout
└── seller/
    ├── page.tsx                  # Dashboard + setup wizard (if no store)
    ├── store/page.tsx            # Store settings
    ├── store/design/page.tsx     # Template switcher + customizer
    ├── products/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [uuid]/page.tsx
    ├── orders/
    │   ├── page.tsx
    │   └── [uuid]/page.tsx
    └── payments/page.tsx

(store)/                          # Public storefronts
├── layout.tsx                    # Dynamic: loads store template
└── store/
    └── [slug]/
        ├── page.tsx              # Store home
        ├── products/
        │   ├── page.tsx
        │   └── [productSlug]/page.tsx
        ├── cart/page.tsx
        ├── checkout/page.tsx
        └── order/[uuid]/page.tsx

middleware.ts                     # Auth routing guard
```

## Design System — Tailwind Config:

```ts
// tailwind.config.ts
colors: {
  brand: {
    50:  '#EEF2FF',
    100: '#E0E7FF',
    500: '#6366F1',  // Primary indigo
    600: '#4F46E5',
    700: '#4338CA',
    900: '#312E81',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    dark: '#0F172A',
  },
  border: {
    DEFAULT: '#E2E8F0',
    light: '#F1F5F9',
  },
  content: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  }
}

// Border radius — modern 2026 style
borderRadius: {
  sm: '6px',
  DEFAULT: '10px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
}
```

## Typography — src/app/layout.tsx:

```tsx
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})
```

In tailwind.config.ts:
```ts
fontFamily: {
  heading: ['var(--font-heading)', 'sans-serif'],
  body: ['var(--font-body)', 'sans-serif'],
  mono: ['var(--font-mono)', 'monospace'],
  sans: ['var(--font-body)', 'sans-serif'],  // default
}
```

## Component Library — src/components/ui/:

Build each with Radix UI + CVA (class-variance-authority). All components must be:
- Fully typed with TypeScript
- Support className prop
- Have proper ARIA attributes
- Support both hy and en text correctly

### Components to create:

**Button** (src/components/ui/Button.tsx)
variants: default (brand), outline, ghost, destructive, success
sizes: sm (h-8), md (h-10), lg (h-12), xl (h-14)
loading state: spinner inside, disabled

**Input** (src/components/ui/Input.tsx)
with optional label, error message, helper text
prefix icon slot, suffix icon slot
error styling: red border + red message

**Textarea** (src/components/ui/Textarea.tsx)
with label, error, optional character counter

**Select** (src/components/ui/Select.tsx)
Radix Select wrapper, searchable variant
Support for option groups

**Badge** (src/components/ui/Badge.tsx)
variants: default, success, warning, error, info, outline, secondary

**Card** (src/components/ui/Card.tsx)
with CardHeader, CardTitle, CardDescription, CardContent, CardFooter

**DataTable** (src/components/ui/DataTable.tsx)
TanStack Table wrapper
Features: sortable columns, row selection checkboxes, pagination, loading skeleton
Empty state slot

**Modal** (src/components/ui/Modal.tsx)
Radix Dialog wrapper
sizes: sm (400px), md (600px), lg (800px), full
ConfirmModal variant: title, message, confirm/cancel buttons, destructive mode

**Toast** — use Sonner, wrapper with Vendora styling:
```tsx
toast.success('Product saved!')
toast.error('Something went wrong')
```

**Avatar** (src/components/ui/Avatar.tsx)
image with fallback initials
sizes: sm (32px), md (40px), lg (56px), xl (80px)

**Skeleton** (src/components/ui/Skeleton.tsx)
shimmer animation
shapes: line, circle, rectangle, card

**Tabs** (src/components/ui/Tabs.tsx)
Radix Tabs wrapper
variants: underline (default), pill, bordered

**FileUpload** (src/components/ui/FileUpload.tsx)
react-dropzone based
Single and multiple mode
Drag-drop + click to browse
File type + size validation
Preview thumbnails

**CurrencyDisplay** (src/components/ui/CurrencyDisplay.tsx)
```tsx
<CurrencyDisplay amount={15000} />
// → "15,000 ֏"
// or "AMD 15,000" based on locale
```

**StatusBadge** (src/components/ui/StatusBadge.tsx)
Maps status strings to colored badges:
active/paid/delivered → success (green)
pending/processing → warning (amber)
suspended/failed/cancelled → error (red)
draft/shipped → info (blue)

**EmptyState** (src/components/ui/EmptyState.tsx)
icon (Lucide), title, description, optional CTA button

**LoadingSpinner** (src/components/ui/LoadingSpinner.tsx)
centered, sizes: sm/md/lg

**SearchInput** (src/components/ui/SearchInput.tsx)
debounced (300ms), clear button, loading state

**Breadcrumb** (src/components/ui/Breadcrumb.tsx)
array of {label, href?} items

**LanguageSwitcher** (src/components/ui/LanguageSwitcher.tsx)
toggle hy ↔ en
show flag emoji + language name: 🇦🇲 Հայ / 🇬🇧 EN

## i18n Setup (next-intl):

### next.config.ts:
```ts
import createNextIntlPlugin from 'next-intl/plugin'
const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
```

### src/i18n/request.ts, routing.ts, navigation.ts — configure locales: ['hy', 'en'], defaultLocale: 'hy'

### src/messages/hy.json (sample structure):
```json
{
  "common": {
    "save": "Պահպանել",
    "cancel": "Չեղարկել",
    "delete": "Ջնջել",
    "edit": "Խմբագրել",
    "loading": "Բեռնվում է...",
    "search": "Որոնել",
    "filter": "Զտել",
    "all": "Բոլոր",
    "yes": "Այո",
    "no": "Ոչ",
    "confirm": "Հաստատել",
    "back": "Վերադառնալ",
    "next": "Հաջորդ",
    "submit": "Ուղարկել",
    "create": "Ստեղծել",
    "update": "Թարմացնել",
    "close": "Փակել",
    "view": "Դիտել",
    "actions": "Գործողություններ",
    "status": "Կարգավիճակ",
    "date": "Ամսաթիվ",
    "amount": "Գումար",
    "total": "Ընդամենը"
  },
  "nav": {
    "stores": "Խանութներ",
    "login": "Մուտք",
    "register": "Գրանցվել",
    "logout": "Ելք",
    "dashboard": "Վահանակ"
  },
  "auth": {
    "login": "Մուտք Գործել",
    "register": "Գրանցվել",
    "email": "Էլ. փոստ",
    "password": "Գաղտնաբառ",
    "forgot_password": "Մոռացե՞լ եք գաղտնաբառը",
    "store_name": "Խանութի Անուն",
    "store_slug": "Խանութի Հասցե"
  },
  "seller": {
    "dashboard": "Վահանակ",
    "products": "Ապրանքներ",
    "orders": "Պատվերներ",
    "payments": "Վճարումներ",
    "store_design": "Ձևավորում",
    "settings": "Կարգավորումներ",
    "add_product": "Ավելացնել Ապրանք",
    "store_status_pending": "Ձեր խանութը սպասում է հաստատման",
    "store_status_suspended": "Ձեր խանութը դադարեցված է"
  },
  "products": {
    "name": "Անուն",
    "price": "Գին",
    "stock": "Պաշար",
    "category": "Կատեգորիա",
    "status": "Կարգավիճակ",
    "draft": "Նախագիծ",
    "active": "Ակտիվ",
    "archived": "Արխիվ",
    "in_stock": "Առկա է",
    "out_of_stock": "Պաշար չկա",
    "low_stock": "Քիչ պաշար"
  },
  "orders": {
    "order_number": "Պատվերի Համար",
    "customer": "Հաճախորդ",
    "pending": "Սպասվում",
    "processing": "Մշակվում",
    "shipped": "Ուղարկված",
    "delivered": "Հանձնված",
    "cancelled": "Չեղարկված"
  },
  "store": {
    "add_to_cart": "Ավելացնել Զամբյուղ",
    "buy_now": "Գնել Հիմա",
    "cart": "Զամբյուղ",
    "checkout": "Վճարել",
    "quantity": "Քանակ",
    "in_stock": "Առկա է",
    "out_of_stock": "Պաշար Չկա",
    "order_placed": "Պատվերն Ընդունված Է",
    "order_number": "Պատվերի Համար"
  }
}
```

### src/messages/en.json — full English equivalents

## API Client — src/lib/api.ts:

```ts
import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor
api.interceptors.request.use((config) => {
  const token = Cookies.get('vendora_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const locale = Cookies.get('NEXT_LOCALE') || 'hy'
  config.headers['Accept-Language'] = locale

  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('vendora_token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

## Zustand Stores:

### src/stores/auth.store.ts
```ts
interface AuthState {
  user: User | null
  token: string | null
  sellerStore: Store | null
  isAuthenticated: boolean
  login: (data: { user: User; token: string; store?: Store }) => void
  logout: () => void
  updateUser: (partial: Partial<User>) => void
  updateStore: (partial: Partial<Store>) => void
}
// Persist token + user to cookie/localStorage
```

### src/stores/cart.store.ts
```ts
interface CartState {
  items: CartItem[]
  storeSlug: string | null
  addItem: (product: Product, variant?: Variant, quantity?: number) => void
  removeItem: (productId: string, variantId?: number) => void
  updateQuantity: (productId: string, variantId?: number, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}
// Persist to localStorage, keyed by storeSlug
```

## React Query — src/lib/query-client.ts:
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

## Middleware — src/middleware.ts:
```ts
// Protect /admin/* → require super-admin role
// Protect /seller/* → require seller role
// Redirect logged-in users away from /auth/*
// Read token from cookie: vendora_token
// Read role from cookie: vendora_role
// For unauthenticated access to protected routes → redirect to /auth/login
```

## Deliverables:
- Complete Next.js 16.2.6 project
- All UI components (with Storybook-like test page at /dev/components)
- next-intl configured (hy + en, all message files)
- API client with interceptors
- Zustand stores (auth + cart)
- React Query client
- Middleware for route protection
- Tailwind configured with Vendora design tokens
- Fonts loaded and Armenian characters display correctly
- ESLint + Prettier configured
```

---

---

# PHASE 10 — Main Public Website (Next.js)

```
Build the main public website for Vendora. This is what visitors see at vendora.am — landing page, store directory, and auth pages.

## 1. Landing Page — (website)/page.tsx

### Hero Section:
- Full viewport height
- Gradient background: from-brand-600 via-brand-700 to-brand-900 (dark indigo)
- Large headline:
  - HY: "Ստեղծեք Ձեր Առցանց Խանութը Հիմա"
  - EN: "Launch Your Online Store Today"
- Subheadline: "Join hundreds of Armenian businesses selling online with Vendora"
- Two CTAs:
  - "Start for Free" → /auth/register (white button)
  - "Browse Stores" → /stores (ghost white button)
- Hero visual: SVG/CSS illustration of a stylized storefront with stats floating badges

### How It Works — 3 Steps:
Grid of 3 step cards with numbered circles:
1. 🏪 Register & Create Store — fill a simple form, pick your store URL
2. 📦 Add Your Products — upload photos, set prices in AMD ֏
3. 💸 Start Selling — share your store link, receive orders

### Features Section — 3 feature cards:
1. 🎨 Beautiful Templates — switch your store design anytime, no coding
2. 💳 Armenian Payments — Idram and local bank integrations
3. 📊 Simple Dashboard — track orders, revenue, products easily

### Featured Stores Grid:
- "Active Stores" heading
- 6 cards in responsive grid (3→2→1 cols)
- Each card: store banner (16:9), logo circle overlay, store name, product count badge
- "Explore All Stores →" link

### Platform Stats Bar:
- Animated count-up on scroll into view
- Stats: Registered Stores / Products Listed / Orders Completed
- Load from GET /api/v1/stats (ISR, revalidate 3600)

### CTA Section:
- "Ready to start selling?" heading
- Single "Create Your Free Store" button → /auth/register
- "It only takes 2 minutes"

### Footer:
```
[Vendora Logo]          Links column:       Social:
Your Armenian           About               Instagram
Store Builder           Contact             Facebook
                        Terms of Use
                        Privacy Policy
                        Language: [🇦🇲 hy | 🇬🇧 en]

© 2026 Vendora. All rights reserved.
```

## 2. Store Directory — (website)/stores/page.tsx

### Layout: sidebar (260px) + main grid
- Left sidebar: category filter (checkboxes), sort selector
- Main area: store cards grid (3 cols desktop)
- URL: /stores?category=3&sort=newest&page=2

### StoreCard Component:
```tsx
<StoreCard>
  <div className="relative aspect-[16/7] overflow-hidden rounded-lg">
    <Image src={store.banner || defaultBanner} fill alt="" />
    <div className="absolute -bottom-6 left-4">
      <Avatar src={store.logo} name={store.name[locale]} size="lg" />
    </div>
  </div>
  <div className="pt-8 px-4 pb-4">
    <h3>{store.name[locale]}</h3>
    <p className="text-content-muted text-sm">{store.category?.name[locale]}</p>
    <div className="flex items-center gap-2 mt-2">
      <Badge variant="outline">{store.product_count} products</Badge>
    </div>
    <Button className="w-full mt-3" variant="outline" size="sm">
      Visit Store →
    </Button>
  </div>
</StoreCard>
```

### Pagination: numbered (1, 2, 3...)

## 3. Auth Pages:

### Login — /auth/login:
- Clean centered card (max-w-md)
- Email + Password inputs
- Remember me checkbox
- "Forgot password?" link
- Submit button: "Sign In"
- Divider + link: "New seller? Create your store →"
- After login: redirect based on role (admin→/admin, seller→/seller, customer→/)

### Register — /auth/register (Multi-step):

**Progress bar with 3 steps at top.**

**Step 1 — Account**
- Full Name
- Email
- Phone (optional)
- Password (with strength meter: weak/fair/good/strong)
- Confirm Password

**Step 2 — Your Store**
- Store Name (two inputs side by side with 🇦🇲 and 🇬🇧 labels)
- Store URL: vendora.am/store/
  - Input: slug (auto-fill from EN name → Str.slug)
  - Real-time availability check (debounced 500ms → GET /api/v1/stores/check-slug?slug=...)
  - ✓ Available / ✗ Taken indicator
- Category dropdown

**Step 3 — Success**
- ✅ Animated checkmark (CSS animation)
- "Your store has been created!"
- Status note: "An admin will review and approve your store shortly."
- Cards:
  - 🛍️ Add your first product → /seller/products/new
  - 🎨 Choose a template → /seller/store/design
  - 📧 Check your email for confirmation

### Forgot Password — /auth/forgot-password:
Email input → submit → "Reset link sent to your inbox" success state

## SEO:
```tsx
export const metadata: Metadata = {
  title: 'Vendora — Armenian Online Store Builder',
  description: 'Create your Armenian online store in minutes. Accept Idram payments, manage products, and grow your business.',
  openGraph: { ... }
}
```

## Performance:
- Landing page: static (generateStaticParams)
- Store directory: ISR (revalidate: 60)
- Images: next/image with blur placeholder

## Deliverables:
- Full landing page (all sections, responsive)
- Store directory with filters
- All 3 auth pages with full form validation (react-hook-form + zod)
- Slug availability check working
- Multi-step registration working end-to-end
- SEO metadata
- Mobile responsive (tested at 375px, 768px, 1280px)
```

---

---

# PHASE 11 — Admin Panel (Next.js)

```
Build the Admin Panel for Vendora. Super admin manages the entire platform. Layout: right-positioned sidebar (WordPress-style).

## Layout — (admin)/layout.tsx

### Right Sidebar (fixed, width 240px):
```
Background: surface-dark (#0F172A)
Text: white

┌────────────────────────┐
│  VENDORA               │
│  Admin                 │
│  ─────────────────     │
│  [🙂] Super Admin       │
│  ─────────────────     │
│  🏠  Dashboard          │
│  ─────────────────     │
│  👥  Sellers            │
│  🏪  Stores             │
│  📦  Products           │
│  ─────────────────     │
│  🏷️  Categories         │
│  🎨  Templates          │
│  💳  Payments           │
│  ─────────────────     │
│  ⚙️  Settings           │
│  ─────────────────     │
│  [Logout]              │
└────────────────────────┘
```

Active nav item: brand-500 background + white left border accent (3px).
Collapsed on mobile: hamburger toggle opens as overlay drawer.

Main content area:
- margin-right: 240px (compensate for fixed sidebar)
- background: surface-secondary
- min-height: 100vh
- padding: 24px

Top bar inside main content:
- Breadcrumb (left)
- Search input + Notifications bell + Admin avatar (right)

## Pages:

### Dashboard — /admin
**Stats Row (4 cards):**
```tsx
<StatCard icon={Users} label="Total Sellers" value={42} trend="+8 this month" color="brand" />
<StatCard icon={Store} label="Active Stores" value={38} trend="+5 this month" color="success" />
<StatCard icon={ShoppingCart} label="Orders Today" value={23} trend="+12% vs yesterday" color="info" />
<StatCard icon={TrendingUp} label="Revenue This Month" value="4,500,000 ֏" trend="+22%" color="warning" />
```

**Charts Row:**
- Left (2/3): Line chart — Orders last 30 days (Recharts, brand colors)
- Right (1/3): Pie chart — Order status distribution

**Pending Approvals Panel:**
Highlighted yellow-bordered section if any stores pending.
List: store name, seller name, registered X days ago, [Approve] [Reject] buttons.

**Recent Orders Table:**
Order # | Store | Customer | Amount | Status | Date

### Sellers — /admin/sellers
Toolbar: Search | Status filter | Export button

Table:
| Avatar+Name | Email | Store | Status | Products | Revenue | Joined | Actions |

Row actions (dropdown):
- View Profile
- Suspend / Activate
- Delete

**Detail Page /admin/sellers/[id]:**
- Left: profile card (avatar, name, email, phone, joined date, last login)
- Right: store info card, stats cards (products/orders/revenue)
- Bottom: order history table
- Danger Zone card (red border): Suspend | Delete with confirm modals

### Stores — /admin/stores
Tabs: All | Pending (count badge) | Active | Suspended

Table:
| Logo+Name | Seller | Template | Products | Orders | Status | Featured | Actions |

**Pending tab** shows stores awaiting approval with highlighted rows.
Quick action buttons: Approve ✓ | Reject ✗

**Detail Page /admin/stores/[slug]:**
- Store preview: banner, logo, name, description
- Seller info section
- Stats: products, orders, revenue
- Configured payment gateways list
- Actions: Approve / Suspend / Feature / Delete

### Categories — /admin/categories
Hierarchical tree with expand/collapse.
Each category row: icon, name (hy/en), product count, sort_order, active toggle, edit button.
"+ Add Category" opens a slide-in panel (not modal — full form needs space):
- Name hy + en inputs
- Parent category select (or "Top Level")
- Icon input (emoji)
- Sort order

Drag-to-reorder within same level (siblings only).

### Templates — /admin/templates
Grid of template cards:
```
┌──────────────────────┐
│  [Preview Image]     │
│  ─────────────────   │
│  Minimal             │
│  Clean and modern    │
│  Used by: 12 stores  │
│  ● Active            │
│  [Edit] [Toggle]     │
└──────────────────────┘
```

### Payment Gateways — /admin/payments
List with:
- Gateway logo + name (hy/en)
- Active store count using it
- Platform active/inactive toggle
- Edit button → slide-in panel with: display name, instructions (hy/en), required_fields JSON editor

### Settings — /admin/settings
Tabs: General | Registration | Email | SEO

Each tab: form with current values, Save button.

## Reusable Admin Components:

```
src/components/admin/
├── AdminSidebar.tsx
├── AdminTopBar.tsx
├── StatCard.tsx
├── AdminTable.tsx          # generic table with filters
├── AdminCharts.tsx         # Recharts wrapper
├── PendingApprovalBanner.tsx
├── ApproveStoreDialog.tsx
├── SuspendDialog.tsx
└── DeleteDialog.tsx
```

## Auth Guard:
- middleware.ts already handles redirect
- AdminLayout also checks: if (!user || user.role !== 'super_admin') → redirect

## Deliverables:
- Full admin layout + sidebar (all nav items, active state, mobile collapse)
- All 7 admin pages
- All CRUD operations connected to API
- Charts with real data from dashboard stats
- Pending approvals flow working
- Settings save working
- Mobile responsive (sidebar as drawer on mobile)
```

---

---

# PHASE 12 — Seller Panel (Next.js)

```
Build the Seller Panel for Vendora. Top navigation layout. Sellers manage their entire store from here.

## Layout — (seller)/layout.tsx

### Top Navigation Bar (height: 64px):
```
┌──────────────────────────────────────────────────────────────────┐
│ [VENDORA]  [Anna's Store ▾]  Overview  Products  Orders  Payments  Design  Settings  [🔔] [Avatar▾] │
└──────────────────────────────────────────────────────────────────┘
```
- Active tab: brand-500 bottom border (3px)
- Store switcher: dropdown (single store for now, future-proof)
- Bell: unread notification count badge
- Avatar dropdown: Profile, Logout

Mobile: hamburger → full-screen drawer with stacked nav items

Breadcrumb bar below top nav (for sub-pages).

## 0. Store Setup Wizard (first login, no store yet):

Full-screen wizard overlay (can't be dismissed):

**Step 1 — Store Info**
- Store name: two inputs [🇦🇲 Armenian Name] [🇬🇧 English Name]
- Store URL: vendora.am/store/ + [slug input with live check]
- Category: select
- Description (optional, hy + en tabs)

**Step 2 — Appearance**
- Logo upload (square, FileUpload component)
- Banner upload (wide, FileUpload component)
- Primary color picker (presets: 8 colors + custom)

**Step 3 — Done!**
- Animated store icon ✅
- "Your store has been submitted for review"
- Or "Your store is live!" (if auto-approved)
- CTA cards: Add First Product | Choose Template

## Pages:

### Dashboard — /seller

**Store Status Banner** (shown when not active):
- Pending: amber background "Your store is awaiting approval. You can add products while waiting."
- Suspended: red background "Your store has been suspended. Contact support@vendora.am"

**Stats Row:**
- Total Products / Active Products
- Total Orders / Orders This Month
- Revenue This Month (֏) / Revenue Today (֏)

**Charts (2 cols):**
- Left: Bar chart — Daily revenue last 14 days
- Right: Donut chart — Order status breakdown

**Quick Actions:**
- + Add New Product → /seller/products/new
- 🔔 View Pending Orders → /seller/orders?status=pending
- 🎨 Change Store Design → /seller/store/design

**Recent Orders Table (5 rows):**
Order # | Customer | Total | Status | Date | View button

### Products — /seller/products

**Toolbar:**
Status tabs: All | Active | Draft | Archived (count per tab)
Search input | Category filter | Sort select | "+ Add Product" button (primary)

**Product Table:**
| ☐ | Image | Name | Category | Price (֏) | Stock | Status | Actions |

Row actions: Edit | Duplicate | Archive | Delete

**Bulk actions bar** (shows when rows selected):
Archive selected | Delete selected | Activate selected

**Product Form — /seller/products/new and /seller/products/[uuid]:**

Sticky header: "New Product" / "Edit: {productName}" + Save Draft | Publish buttons

**Section 1 — Basic Info:**
- Product name: side-by-side inputs with flag labels [🇦🇲] [🇬🇧]
- Slug: auto-filled from EN name, editable, check URL
- Category: searchable select

**Section 2 — Descriptions:**
Tab switcher [🇦🇲 Armenian] [🇬🇧 English] for each:
- Short Description: textarea (max 200 chars, counter shown)
- Full Description: rich text toolbar (Bold, Italic, Underline, UL, OL, Link, H2, H3)

**Section 3 — Pricing:**
```
┌─────────────────────────────────────────┐
│ Price (AMD ֏)     Compare Price (֏)     │
│ [     15,000   ]  [     20,000   ]      │
│                                         │
│ Cost Price (private)     Margin         │
│ [      8,000   ]         46.7% = 7,000֏ │
└─────────────────────────────────────────┘
```
Live margin calculator: (price - cost) / price × 100

**Section 4 — Inventory:**
- SKU input
- Manage Stock toggle
- Stock Quantity (visible if manage stock = on)
- Allow Backorders toggle (visible if manage stock = on)

**Section 5 — Photos:**
```
Drag and drop images here
or click to browse
Max 10 images • Max 5MB each • JPG, PNG, WebP
```
Image preview grid (drag to reorder).
First = primary (badge: "Main Photo").
X button to delete.

**Section 6 — Variants:**
Toggle: "This product has multiple variants"
If enabled:
- Add attribute row: [Attribute Name] + [+ Add Value]
- E.g. "Color": Red, Blue, Green
- Generated variant table: Color | Size | Price | Stock | SKU | Active

**Section 7 — SEO:**
- Meta Title (hy + en tabs)
- Meta Description (hy + en tabs, max 160 chars with counter)
- Google preview component:
```
vendora.am › store › annas-store › products › red-rose
Meta Title Here
Meta description preview — first 160 chars shown here...
```

**Right sidebar sticky panel:**
```
┌──────────────────────┐
│ Status               │
│ ○ Draft  ● Active    │
│                      │
│ Visibility           │
│ □ Featured product   │
│                      │
│ [Save Draft]         │
│ [Publish ▲]          │
└──────────────────────┘
```

### Orders — /seller/orders

**Status filter tabs with count badges.**

**Order Table:**
| Order # | Customer | Items | Total (֏) | Payment | Status | Date | View |

**Order Detail — /seller/orders/[uuid]:**
Two-column layout:

Left (2/3):
- Items table: [image] Product / Variant / Qty / Unit ֏ / Total ֏
- Order Notes (from customer)
- Timeline: Pending → Paid (date) → Processing → Shipped (date) → Delivered

Right (1/3):
- Summary card: Subtotal, Shipping, Tax, **Total ֏**
- Customer info card: name, email, phone
- Shipping Address card
- Payment card: gateway logo, transaction ID, paid at
- **Update Status card:**
  - Current: [Processing ▾] dropdown for next valid statuses
  - [Update Status] button → confirm dialog → API call → refetch

### Payments — /seller/payments

**Page heading:** "Payment Gateways — let your customers pay online"

**Available Gateways grid:**
```
┌─────────────────────────┐   ┌─────────────────────────┐
│ [Idram Logo]            │   │ [Innecobank Logo]        │
│ Idram — Ֆ ԻԴ ՌԱՄ      │   │ Innecobank              │
│                         │   │                         │
│ ✅ Configured + Active  │   │ Coming Soon             │
│                         │   │                         │
│ [Edit Config]           │   │ [Notify Me]             │
└─────────────────────────┘   └─────────────────────────┘
```

**Configure Gateway Modal (for Idram):**
```
💳 Configure Idram

[Idram Logo]
Idram (Ֆ ԻԴ ՌԱՄ)

📋 How to get credentials:
Contact Idram at developer@idram.am with your business details
to receive your EDP ID and Secret Key.

──────────────────────────────

EDP ID:         [________________]
Secret Key:     [________________] [👁 show/hide]

──────────────────────────────

⚙️ Sandbox Mode  [Toggle ON/OFF]
   Use sandbox for testing. No real payments.

🟢 Enable Idram for my store  [Toggle ON/OFF]

[Cancel]   [Save Configuration]
```

### Store Design — /seller/store/design

**Layout: left panel (300px) + right preview (rest)**

**Left Panel:**

Section 1: Template
List of template cards (compact, horizontal):
```
[●] Minimal    Clean & modern        [Active]
[ ] Bold       High-impact style     [Preview]
[ ] Elegant    Premium & luxurious   [Preview]
```

Click "Preview" → loads store in iframe with that template.
"Apply Template" button → confirm dialog (warns: "This will change your store's look. You can change back anytime.")

Section 2: Colors (shows after template selected)
```
Primary Color:    [████] #6366F1  [color picker]
Secondary Color:  [████] #8B5CF6  [color picker]
```

Section 3: Font Pair
```
[○] Plus Jakarta Sans + Inter   (Modern)
[●] Playfair Display + Lato     (Elegant)
[○] Montserrat + Open Sans      (Bold)
[○] Libre Baskerville + Source Sans Pro (Classic)
```

Section 4: Layout
```
Products per row: [2] [3✓] [4]
Show hero banner: [Toggle]
Show categories bar: [Toggle]
```

**[Save Design]** button (sticky at bottom of left panel)

**Right Panel (iframe):**
```
┌─────────────────────────────────────────────┐
│  [↺ Refresh]  [📱 Mobile] [💻 Desktop]      │
│  Preview: vendora.am/store/annas-store       │
│ ─────────────────────────────────────────── │
│                                             │
│    [Live Store Preview in iframe]           │
│                                             │
└─────────────────────────────────────────────┘
```

Changes in left panel auto-update iframe (debounced 500ms) via URL params: ?preview=true&primary=%236366F1&template=bold

### Store Settings — /seller/store

Tabs: General | Appearance | Social | SEO | Danger Zone

Each tab is a form section.

## Seller-Specific Components:
```
src/components/seller/
├── SellerTopNav.tsx
├── StoreSetupWizard.tsx
├── StoreStatusBanner.tsx
├── ProductForm.tsx        # large, sectioned form
├── ProductImageUpload.tsx
├── VariantEditor.tsx
├── PricingSection.tsx
├── MarginCalculator.tsx
├── SeoPreview.tsx
├── OrderTimeline.tsx
├── OrderStatusUpdater.tsx
├── GatewayCard.tsx
├── GatewayConfigModal.tsx
├── TemplateSelector.tsx
└── StorePreviewFrame.tsx
```

## Deliverables:
- Full seller layout with top nav
- Store setup wizard (shows if no store)
- All seller pages built and connected to API
- Product form fully working (all 7 sections)
- Image upload → imgproc → preview working
- Template switcher with live preview iframe
- Payment gateway config modal with Idram fields
- All forms: react-hook-form + zod validation
- Mobile responsive
```

---

---

# PHASE 13 — Store Storefronts & Template System (Next.js)

```
Build the public-facing storefront that customers visit. Implement a no-code template system where sellers can switch between 3 distinct templates without touching code.

## Template Architecture:

### Template Interface:
Each template is a folder under src/templates/{key}/ that exports:
```ts
// src/templates/minimal/index.ts
export { StoreHeader } from './StoreHeader'
export { StoreFooter } from './StoreFooter'
export { StoreHome } from './StoreHome'
export { ProductGrid } from './ProductGrid'
export { ProductCard } from './ProductCard'
export { ProductDetail } from './ProductDetail'
export { CartDrawer } from './CartDrawer'
export { CheckoutForm } from './CheckoutForm'
```

### Template Loader (src/lib/templates.ts):
```ts
const templateLoaders = {
  minimal: () => import('@/templates/minimal'),
  bold:    () => import('@/templates/bold'),
  elegant: () => import('@/templates/elegant'),
} as const

export type TemplateKey = keyof typeof templateLoaders

export async function loadTemplate(key: TemplateKey | string) {
  const loader = templateLoaders[key as TemplateKey] ?? templateLoaders.minimal
  return loader()
}
```

### Store Layout — (store)/layout.tsx:
```tsx
async function StoreLayout({ children, params }) {
  const store = await fetchStoreInfo(params.slug)

  if (!store) notFound()

  const template = await loadTemplate(store.active_template_key)

  // Apply store custom colors as CSS variables
  const cssVars = {
    '--store-primary': store.template_config.primary_color,
    '--store-secondary': store.template_config.secondary_color,
    '--store-font-heading': store.template_config.font_heading,
  }

  return (
    <div style={cssVars as React.CSSProperties}>
      <template.StoreHeader store={store} />
      {children}
      <template.StoreFooter store={store} />
    </div>
  )
}
```

### Store Data Context:
```tsx
// Provide store data to all storefront pages
<StoreProvider store={store}>
  {children}
</StoreProvider>
```

## Template 1: "Minimal" (src/templates/minimal/)

**Design:** Clean, white, spacious. Inter font. 1px borders. Subtle shadows.

**StoreHeader:**
- White sticky header, bottom border
- Left: store logo + name
- Center: category nav links (scrollable on mobile)
- Right: search icon, cart icon (with count badge)

**StoreHome:**
- Hero: store banner image (full width, 40vh height), store name overlay
- Category pills row (horizontal scroll): All | Category A | Category B | ...
- "Featured Products" section (if any)
- Products grid: 3 cols desktop → 2 tablet → 1 mobile

**ProductCard (Minimal):**
```
┌──────────────────────┐
│  [Product Image]     │
│  (square, 1:1 ratio) │
├──────────────────────┤
│  Product Name        │
│  15,000 ֏  ~~20,000֏~~│
│  [Add to Cart]       │
└──────────────────────┘
```
Hover: subtle shadow elevation + "Quick Add" overlay on image.

**StoreFooter (Minimal):**
- Store name + tagline
- Social links
- "Powered by Vendora" (small, gray)

## Template 2: "Bold" (src/templates/bold/)

**Design:** High-contrast. Store primary color dominates the header. Large type. Bold card borders. Plus Jakarta Sans heading font.

**StoreHeader:**
- Full-width header filled with store primary color
- White text: large store logo + name
- Navigation: bold white links
- Cart: white icon with contrasting badge

**StoreHome:**
- Hero: large gradient (store primary → secondary), full-width text CTA
- Categories: full-width colored cards with large icons
- Products: masonry-style layout (2-3 cols, varying heights)
- "New Arrivals" horizontal scroll section

**ProductCard (Bold):**
```
┌──────────────────────┐
│  [Product Image]     │
│  (3:4 ratio)         │
│                      │
├──(thick border)──────┤
│  PRODUCT NAME        │  ← uppercase
│  15,000 ֏            │
│  [ADD TO CART ▶]     │
└──────────────────────┘
```

**StoreFooter (Bold):**
- Dark background (near-black)
- White text columns: store info, links, contact

## Template 3: "Elegant" (src/templates/elegant/)

**Design:** Luxury/premium feel. Serif headings (Playfair Display). Warm neutrals. Generous whitespace. Gold accent.

**StoreHeader:**
- Thin top bar: social links + language
- Center-aligned logo + store name (large serif)
- Horizontal nav below: HOME | PRODUCTS | ABOUT | CONTACT
- Cart as text link: "BAG (2)"

**StoreHome:**
- Full-screen hero: parallax banner with centered text overlay
- "Our Collection" section heading (serif, centered)
- Products: 4-column grid, no border, hover scale
- "Featured" section: alternating image + text layout

**ProductCard (Elegant):**
```
  [Product Image]
  (portrait 2:3)
  
  Product Name
  15,000 ֏
  + Add to Bag
```
Minimal. No border. Centered text. Hover underline on name.

## Storefront Pages (shared logic, template-specific rendering):

### Store Home — /store/[slug]
```tsx
const Template = await loadTemplate(store.active_template_key)
return <Template.StoreHome store={store} featuredProducts={featured} allProducts={products} />
```

### Product Listing — /store/[slug]/products
Query params: ?category=3&sort=price_asc&page=2
- Category filter sidebar or top filter chips (depends on template)
- Product grid using template's ProductGrid component

### Product Detail — /store/[slug]/products/[productSlug]
- Image gallery: main image + thumbnail strip
- Variant selector: color swatches or size chips
- Quantity stepper: − [2] +
- Price + compare price (strikethrough if set)
- Stock status badge
- "Add to Cart" button (with loading state + success animation)
- Rich text description
- Breadcrumb

### Cart — /store/[slug]/cart
- Cart items list:
  [Image] Product Name / Variant
         Qty stepper    ×Remove
         Unit price     = Line total
- Order Summary:
  Subtotal: 35,000 ֏
  Shipping: Free
  **Total: 35,000 ֏**
- [Proceed to Checkout →] button
- Empty cart: illustration + "Your cart is empty" + "Browse Products" link

### Checkout — /store/[slug]/checkout
**Two-column layout:**

Left — Form:
1. Customer Info: Full Name, Email, Phone
2. Delivery Address: Street, City, Postal Code, Country (default: Armenia)
3. Order Notes: optional textarea
4. Payment Method:
```
Select how you'd like to pay:
○ [Idram Logo] Pay with Idram
○ [Innecobank Logo] Coming Soon (disabled)
```

Right — Order Summary:
- Items list (compact)
- Subtotal / Total
- [Place Order & Pay →] button

**On submit:**
1. Validate all fields (react-hook-form + zod)
2. POST /api/v1/store/{slug}/checkout → get order_uuid
3. POST /api/v1/store/{slug}/payments/initiate → get redirect_url
4. window.location.href = redirect_url (→ Idram or sandbox)

### Order Confirmation — /store/[slug]/order/[uuid]
- CSS confetti animation (5 seconds)
- ✅ Large green checkmark
- "Order Placed!" / "Ձեր Պատվերն Ընդունվեց!"
- Order #: VEND-2026-00042 (large, prominent)
- Summary: items, total
- "An email confirmation has been sent to anna@example.com"
- [Continue Shopping] button → back to store home

## Preview Mode:
When ?preview=true in URL:
- Show floating "Preview Mode" banner at top
- Override template with ?template=bold
- Override colors with URL params: ?primary=%236366F1
- Don't track analytics or cart actions
- Used by seller's design panel iframe

## Cart State — Zustand with localStorage:
Key in localStorage: `vendora_cart_{storeSlug}`
Cross-tab sync via storage events.

## SEO for Storefronts:
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const store = await fetchStoreInfo(params.slug)
  const locale = /* from cookie or default */ 'hy'
  return {
    title: store.meta_title?.[locale] ?? store.name[locale] + ' | Vendora',
    description: store.meta_description?.[locale] ?? store.description?.[locale],
    openGraph: {
      title: store.name[locale],
      images: [{ url: store.banner }],
    }
  }
}
```

## Deliverables:
- Template registry + dynamic loader
- All 3 complete templates (Minimal, Bold, Elegant) — all components
- All 6 store pages (Home, Products, Product Detail, Cart, Checkout, Order Confirm)
- Cart with localStorage persistence per store
- Checkout → payment initiate flow working
- Order confirmation page with animation
- Preview mode (?preview=true)
- SEO metadata
- Mobile responsive for all 3 templates
- Test: visit /store/demo-store → verify Minimal template loads, products appear, add to cart works
```

---

---

# PHASE 14 — Public Store API + Checkout Flow (Laravel)

```
Implement the public store endpoints that power the storefronts. All under /api/v1/store/ with ResolveStore middleware.

## 1. Store Info — GET /api/v1/store/{slug}/info

Cache: Redis "store:public:{slug}", TTL 5 min
Flush on: Store model saved, template config saved

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "annas-store",
    "name": {"hy": "Աննայի Խանութ", "en": "Anna's Store"},
    "description": {"hy": "...", "en": "..."},
    "logo": "https://vendora.am/storage/images/stores/1/uuid/thumbnail.webp",
    "banner": "https://vendora.am/storage/images/stores/1/uuid/large.webp",
    "active_template_key": "minimal",
    "template_config": {
      "primary_color": "#6366F1",
      "secondary_color": "#8B5CF6",
      "font_pair": "plus_jakarta_inter",
      "layout_columns": 3,
      "show_hero": true,
      "show_categories_bar": true
    },
    "payment_gateways": ["idram"],
    "currency": "AMD",
    "social_links": {},
    "meta_title": {"hy": "...", "en": "..."},
    "meta_description": {"hy": "...", "en": "..."}
  }
}
```

template_config is fetched from MongoDB collection store_template_configs where store_id = X.
If no config exists in MongoDB, return store's primary_color and defaults.

## 2. Products — GET /api/v1/store/{slug}/products

Query params: page, per_page (max 50), category_id, sort (price_asc, price_desc, newest, featured), search
Only return: status = 'active' products

Response (paginated):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "uuid": "...",
        "name": {"hy": "...", "en": "..."},
        "slug": "red-rose",
        "short_description": {"hy": "...", "en": "..."},
        "price": 15000,
        "compare_price": 20000,
        "primary_image": {
          "thumbnail": "...",
          "medium": "..."
        },
        "stock_status": "in_stock",
        "is_featured": false,
        "category": {"id": 3, "name": {"hy": "...", "en": "..."}}
      }
    ],
    "meta": {"current_page": 1, "per_page": 20, "total": 45, "last_page": 3}
  }
}
```

Cache: Redis "store:{slug}:products:{queryHash}", TTL 2 min
Flush on: any product updated in this store

## 3. Product Detail — GET /api/v1/store/{slug}/products/{productSlug}

Return: full product with all images (medium + large URLs), all active variants, full bilingual descriptions
Only if product.status = 'active' and belongs to this store → else 404
Cache: Redis "store:{slug}:product:{productSlug}", TTL 5 min

## 4. Categories — GET /api/v1/store/{slug}/categories

Return platform categories that have at least 1 active product in this store.
Include: id, name, product_count

## 5. Checkout — POST /api/v1/store/{slug}/checkout

Request validation:
```php
$rules = [
  'items' => 'required|array|min:1',
  'items.*.product_uuid' => 'required|string',
  'items.*.variant_id' => 'nullable|integer',
  'items.*.quantity' => 'required|integer|min:1|max:100',
  'customer.name' => 'required|string|max:255',
  'customer.email' => 'required|email',
  'customer.phone' => 'nullable|string',
  'shipping_address.line1' => 'required|string',
  'shipping_address.city' => 'required|string',
  'shipping_address.country' => 'required|string|size:2',
  'payment_gateway' => 'required|string',
  'notes' => 'nullable|string|max:500',
];
```

Processing (all inside DB::transaction()):
```php
// 1. For each item: lock product for update, verify active + belongs to store
foreach ($items as $item) {
    $product = Product::where('uuid', $item['product_uuid'])
        ->where('store_id', $store->id)
        ->where('status', ProductStatus::Active)
        ->lockForUpdate()
        ->firstOrFail();

    // Check variant if provided
    if ($item['variant_id']) {
        $variant = ProductVariant::where('id', $item['variant_id'])
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->firstOrFail();
        $price = $variant->price ?? $product->price;
        $stock = $variant->stock;
        $managedStock = $product->manage_stock;
    } else {
        $price = $product->price;
        $stock = $product->stock;
        $managedStock = $product->manage_stock;
    }

    // Validate stock
    if ($managedStock && !$product->allow_backorders && $stock < $item['quantity']) {
        throw ValidationException::withMessages([
            "items.{$index}.quantity" => "Insufficient stock for: {$product->name[$locale]}"
        ]);
    }
}

// 2. Create Order
$order = Order::create([
    'store_id' => $store->id,
    'status' => OrderStatus::Pending,
    'payment_status' => PaymentStatus::Pending,
    'subtotal' => $subtotal,
    'total' => $subtotal,   // + shipping + tax if applicable
    'currency' => 'AMD',
    'customer_name' => $request->customer['name'],
    'customer_email' => $request->customer['email'],
    'customer_phone' => $request->customer['phone'] ?? null,
    'shipping_address' => $request->shipping_address,
    'notes' => $request->notes,
]);

// 3. Create OrderItems + decrement stock
foreach ($items as $item) {
    $order->items()->create([...]);

    if ($item['variant_id']) {
        ProductVariant::where('id', $item['variant_id'])->decrement('stock', $item['quantity']);
    } else {
        $product->decrement('stock', $item['quantity']);
    }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "order_uuid": "abc-123",
    "order_number": "VEND-2026-00042",
    "total": 35000,
    "currency": "AMD",
    "payment_gateway": "idram"
  }
}
```

## 6. Initiate Payment — POST /api/v1/store/{slug}/payments/initiate

See Phase 7 for full implementation.
Validate: order must belong to this store, be in pending status, payment_status = pending
Load store's gateway credentials (decrypt)
Create Transaction record
Return {redirect_url}

## 7. Payment Callback — POST /api/v1/store/{slug}/payments/callback/{gateway}

See Phase 7 for full Idram callback implementation.
Exclude from: CSRF, auth, rate-limit middleware.
Log all raw data to Laravel log channel immediately on entry.
Return "OK" plain text for Idram.

## 8. Sandbox Payment Simulation — GET /api/v1/store/payments/sandbox/pay

Blade view. Check: APP_ENV !== 'production' OR IDRAM_SANDBOX === true.
Show transaction details + two action buttons.
On "Pay": POST fake callback data → verify → redirect to success URL.
On "Cancel": redirect to failure URL.

## 9. Public Platform Endpoints:

### GET /api/v1/stats
```json
{"total_stores": 48, "total_products": 1240, "total_orders": 892}
```
Cache: Redis "platform:stats", TTL 1 hour

### GET /api/v1/stores/featured
6 featured stores (is_featured = true, status = active)
Cache: Redis "stores:featured", TTL 15 min

### GET /api/v1/stores/check-slug?slug={slug}
For register form real-time check.
Rate limited: 20/min per IP.
Response: {available: true/false}

## Rate Limiting (in bootstrap/app.php):
```php
RateLimiter::for('api', fn($request) => Limit::perMinute(100)->by($request->ip()));
RateLimiter::for('auth', fn($request) => Limit::perMinute(5)->by($request->ip()));
RateLimiter::for('checkout', fn($request) => Limit::perMinute(10)->by($request->ip()));
```

## Deliverables:
- All public store controllers
- ResolveStore middleware
- Checkout with DB transaction + pessimistic locking
- Payment initiate + callback
- Sandbox page working
- All caching layers
- Rate limiting applied
- Tests: StorePublicTest.php, CheckoutTest.php, PaymentCallbackTest.php
```

---

---

# PHASE 15 — Integration, Testing & Production Readiness

```
Finalize Vendora: end-to-end testing, performance optimization, and production configuration.

## 1. End-to-End Integration Flows to Verify:

### Flow A: Seller Onboarding
1. POST /auth/register → receive token
2. GET /auth/me → role = seller, no store
3. POST /seller/store → create store (status = pending)
4. Verify WelcomeSellerNotification queued (check Redis queue)
5. POST /seller/store/logo → upload logo, verify WebP variants created in storage
6. POST /seller/products → create product (status = draft)
7. POST /seller/products/{uuid}/images → upload 2 images
8. PATCH /seller/products/{uuid}/status → {status: active}
9. GET /store/{slug}/products → product NOT visible yet (store still pending)

### Flow B: Admin Approves Store
1. Login as admin@vendora.am / password
2. GET /admin/stores?status=pending → see the store
3. PATCH /admin/stores/{slug}/approve → status = active
4. Verify StoreApprovedNotification queued
5. GET /store/{slug}/info → store now returns (status active)
6. GET /store/{slug}/products → product now visible

### Flow C: Customer Checkout with Idram Sandbox
1. GET /store/{slug}/products → see product
2. GET /store/{slug}/products/red-rose → product detail
3. POST /store/{slug}/checkout → create order, get order_uuid
4. POST /store/{slug}/payments/initiate → get sandbox redirect_url
5. GET sandbox redirect_url → see sandbox payment page
6. Click "Simulate Successful Payment" → callback fires
7. GET /store/{slug}/order/{uuid} → see confirmation page
8. GET /seller/orders (as seller) → see the new order
9. PATCH /seller/orders/{uuid}/status → {status: shipped}
10. Verify OrderStatusChangedNotification queued

### Flow D: Template Switch
1. As seller: GET /seller/store/template/available → 3 templates
2. PATCH /seller/store/template/active → {template_key: "bold"}
3. PATCH /seller/store/template/config → {primary_color: "#EF4444", layout_columns: 2}
4. GET /store/{slug}/info → verify active_template_key = "bold", config updated
5. Visit /store/{slug} in browser → see Bold template with red primary color

## 2. Test Suite:

### Laravel Feature Tests (use RefreshDatabase + factories):

**AuthTest.php**
- register with valid data → 201 + token
- register with duplicate email → 422
- login with valid credentials → 200 + token + role
- login with wrong password → 401
- GET /auth/me with valid token → 200 + user
- GET /auth/me without token → 401
- logout → 200, token revoked

**AdminSellerTest.php**
- list sellers (as admin) → 200 paginated
- suspend seller → 200, status = suspended
- access admin routes as seller → 403

**AdminStoreTest.php**
- approve pending store → 200, notification queued
- suspend active store → 200
- feature store → 200, is_featured = true

**SellerProductTest.php**
- create product → 201
- auto slug generation → "Red Rose" → "red-rose"
- duplicate slug → "red-rose-2"
- upload images → 200, 4 WebP variants exist in storage
- list products (scoped to own store) → 200
- cannot access another store's products → 403/404

**SellerOrderTest.php**
- list orders (own store only) → 200
- update order status: pending → paid → 422 (invalid transition)
- update order status: paid → processing → 200

**CheckoutTest.php**
- valid checkout → 201, order created, stock decremented
- checkout with insufficient stock → 422
- checkout with out-of-stock product → 422
- order number format: VEND-{year}-{padded}

**PaymentCallbackTest.php**
- valid Idram callback with correct signature → 200, text "OK", order paid
- invalid Idram callback with wrong signature → 400
- callback for already-paid order → 200 "OK" (idempotent, don't double-pay)

**StorePublicTest.php**
- get info for active store → 200
- get info for suspended store → 503
- get products → only active products returned
- get product from wrong store → 404

### Next.js Tests (Vitest):

**Component tests:**
- Button renders variants correctly
- Input shows error state
- CurrencyDisplay formats AMD correctly: 15000 → "15,000 ֏"
- StatusBadge maps "active" → green badge

**Store tests:**
- cart.store: addItem, removeItem, updateQuantity, getTotal
- auth.store: login sets user + token, logout clears

## 3. Laravel Factories for all models:

UserFactory, StoreFactory, ProductFactory, ProductImageFactory, OrderFactory, OrderItemFactory

Example ProductFactory:
```php
public function definition(): array {
    return [
        'uuid' => Str::uuid(),
        'store_id' => Store::factory(),
        'name' => ['hy' => fake()->words(3, true), 'en' => fake()->words(3, true)],
        'slug' => fake()->unique()->slug(),
        'price' => fake()->numberBetween(1000, 100000),
        'stock' => fake()->numberBetween(0, 200),
        'status' => 'active',
    ];
}
```

## 4. Demo Seeder — DemoSeeder.php:

Creates realistic demo data:
- 1 super admin: admin@vendora.am / password
- 3 demo sellers (all active):
  - demo1@vendora.am / password → store: "demo-artisan" (active, template: elegant)
  - demo2@vendora.am / password → store: "demo-fashion" (active, template: bold)
  - demo3@vendora.am / password → store: "demo-tech" (active, template: minimal)
- 15 products per store (realistic names in hy + en, prices in AMD 1000-50000)
- 2 images per product (placeholder images from picsum.photos)
- 5 delivered orders per store
- All 3 stores configured with Idram (sandbox mode)
- All 3 stores featured (is_featured = true)

Run: `php artisan db:seed --class=DemoSeeder`

## 5. Performance Checklist:

### Laravel:
- [ ] All queries use eager loading (no N+1) — use Laravel Debugbar in dev
- [ ] Redis caching on all public endpoints
- [ ] Redis caching on admin dashboard stats
- [ ] All notifications + emails go through queues
- [ ] Database indexes verified (EXPLAIN on slow queries)
- [ ] php artisan optimize in production

### Next.js:
- [ ] Store home and product listing pages use ISR (revalidate: 60)
- [ ] next/image used for all images
- [ ] Heavy components use dynamic import with loading fallback
- [ ] Bundle size checked: `next build --analyze` (no bundle > 200KB initial)

## 6. Production Docker Config:

### docker-compose.prod.yml additions:
```yaml
services:
  api:
    restart: unless-stopped
    environment:
      APP_ENV: production
      APP_DEBUG: false
    healthcheck:
      test: ["CMD", "php", "artisan", "health"]
      interval: 30s

  web:
    restart: unless-stopped
    environment:
      NODE_ENV: production
    command: ["node", "server.js"]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]

  mysql:
    restart: unless-stopped
    command: --slow-query-log=1 --slow-query-log-file=/var/log/mysql/slow.log

  redis:
    restart: unless-stopped
    command: redis-server --appendonly yes --appendfsync everysec

  nginx:
    restart: unless-stopped
    volumes:
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
```

## 7. API Documentation:

Scramble auto-docs available at: /api/docs (dev only)
Add docblocks to all controllers for better docs:
```php
/**
 * @response 200 {"success": true, "data": {...}}
 * @response 404 {"success": false, "message": "Store not found"}
 */
```

## 8. Health Check Endpoint — GET /api/v1/health:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-05-10T12:00:00Z",
  "services": {
    "database": "ok",
    "mongodb": "ok",
    "redis": "ok",
    "storage": "ok",
    "queue": "ok"
  }
}
```

## 9. README.md — Final:

Include:
- Project overview paragraph
- ASCII architecture diagram
- Tech stack table
- Prerequisites: Docker, Docker Compose, Git
- Local setup (5 commands):
  ```bash
  git clone https://github.com/yourname/vendora
  cd vendora
  cp .env.example .env        # edit with your values
  docker compose up -d
  docker compose exec api php artisan migrate --seed
  ```
- Access URLs table:
  | URL | Description |
  |-----|-------------|
  | http://localhost | Main website |
  | http://localhost/admin | Admin panel |
  | http://localhost/seller | Seller panel |
  | http://localhost/store/demo-artisan | Demo storefront |
  | http://api.localhost/api/docs | API documentation |
  | http://localhost:8025 | Mailpit (email preview) |

- Demo credentials table
- "How to add a new payment gateway" (5-step guide)
- "How to add a new store template" (4-step guide)
- Environment variables reference

## Deliverables:
- All integration flows passing
- Full test suite green
- DemoSeeder working
- `docker compose up -d && php artisan migrate --seed` → everything running
- API docs accessible
- Production docker config ready
- Final README complete
```

---

---

## 📦 FINAL TECH STACK

| Category | Technology | Version |
|----------|-----------|---------|
| **Backend API** | Laravel | 13.x |
| **Runtime** | PHP | 8.5 |
| **Frontend** | Next.js | 16.2.6 |
| **Language** | TypeScript | 5.x |
| **Primary DB** | MySQL | 8.0 |
| **Document Store** | MongoDB | 7.0 |
| **Cache & Queue** | Redis | 7.x |
| **Web Server** | Nginx | 1.25 |
| **Containers** | Docker + Compose | Latest |
| **Auth** | Laravel Sanctum | Latest |
| **Permissions** | Spatie Permission | Latest |
| **Image Processing** | Intervention Image (Laravel) | 3.x |
| **Transactional Email** | Brevo (API v3) | — |
| **Email Dev** | Mailpit | Latest |
| **State Management** | Zustand | 4.x |
| **Data Fetching** | TanStack Query | 5.x |
| **Forms** | React Hook Form + Zod | Latest |
| **UI Base** | Radix UI | Latest |
| **Styling** | Tailwind CSS | 4.x |
| **Charts** | Recharts | 2.x |
| **Tables** | TanStack Table | 8.x |
| **Notifications** | Sonner | Latest |
| **Fonts** | Plus Jakarta Sans, Inter | — |
| **i18n** | next-intl | Latest |
| **Payments** | Idram (+ Innecobank/Converse stubs) | — |
| **API Docs** | Scramble | Latest |
| **Auditing** | Laravel Auditing | Latest |

---

## 🏗️ ARCHITECTURE (ASCII)

```
                         ┌─────────────────────────────────────────┐
                         │               NGINX 1.25                │
                         │  vendora.am → Next.js 16               │
                         │  api.vendora.am → Laravel 13            │
                         │  *.vendora.am → Next.js (subdomains)    │
                         └──────┬──────────────────┬───────────────┘
                                │                  │
                    ┌───────────▼───┐      ┌───────▼───────────┐
                    │  Next.js 16   │      │   Laravel 13       │
                    │  TypeScript   │─────►│   PHP 8.5          │
                    │               │      │                    │
                    │  (website)    │      │  ┌──────────────┐  │
                    │  (admin)      │      │  │ ImageService │  │
                    │  (seller)     │      │  │ (Intervention│  │
                    │  (store)      │      │  │  Image 3.x)  │  │
                    └───────────────┘      │  └──────────────┘  │
                                           │                    │
                                           │  ┌──────────────┐  │
                                           │  │ Brevo Mail   │  │
                                           │  │ Transport    │  │
                                           │  └──────────────┘  │
                                           └────────┬───────────┘
                                                    │
                         ┌──────────────────────────┼──────────────────────────┐
                         │                          │                          │
                  ┌──────▼──────┐         ┌─────────▼──────┐         ┌────────▼───────┐
                  │  MySQL 8.0  │         │  MongoDB 7.0   │         │   Redis 7.x    │
                  │             │         │                │         │                │
                  │  users      │         │  store_template│         │  Cache (10min) │
                  │  stores     │         │  _configs      │         │  Queue jobs    │
                  │  products   │         │  (template     │         │  Sessions      │
                  │  orders     │         │   customization│         │  Rate limits   │
                  │  payments   │         │   per store)   │         │                │
                  └─────────────┘         └────────────────┘         └────────────────┘
```

---

*Vendora — Armenian E-Commerce Store Builder*
*15 Phases | Laravel 13 + PHP 8.5 + Next.js 16.2.6 | Brevo Email | No Go*
