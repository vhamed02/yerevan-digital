# Vendora — Multilingual System (HY · EN · RU)

> **Living document.** Kept up to date as work progresses. Each phase updates the
> status table, the progress log, and any decisions that change.
> Last updated: 2026-05-31 · Status: **Phase 5 complete; Phase 6 next**

---

## Goal

Turn the platform from a (nominally) bilingual **Armenian + English** system into a
genuine trilingual one — **Armenian (`hy`), English (`en`), Russian (`ru`)** — for the
**customer-facing** surfaces, with Russian content authoring for sellers/admins.

## Scope decisions (locked)

| Decision | Choice |
|---|---|
| **Depth** | **Customer-facing first** — public storefront + marketing site + transactional emails fully trilingual. Seller/admin dashboards gain Russian **content-authoring capability** but their internal UI chrome stays English for now. |
| **Content authoring** | **Full Russian authoring** — sellers/admins can enter Russian product/store/category text. RU is **optional per field** (never forced); existing content falls back until filled. |
| **Fallback chain** | **visitor's language → English → Armenian.** (`en` is the canonical key, used for slugs.) |
| **Super admin** | **English only.** No language switcher is shown in the admin area / for super-admin users. The admin dashboard chrome stays English and is out of scope for translation. |
| **URL strategy** | Keep current `next-intl` `localePrefix: 'as-needed'` — `hy` is prefixless (default), `/en` and `/ru` are prefixed. |
| **Translations** | Authored by Claude for launch; flag for a native-speaker review pass later. |

## Key finding driving the work

The app was **not genuinely bilingual** before this: ~95% of UI text was hardcoded
(storefront in Armenian, dashboards in English), and ~120 content-display sites used
`name.hy || name.en` — always preferring Armenian, never consulting the visitor's
locale. The data layer was already fine (all translatable columns are free-form JSON,
so a third locale needs **no content migration**).

## Architecture

- **`pickLang(field, locale)`** (frontend, `src/lib/i18n.ts`): single locale-aware
  accessor for `MultiLang` content with fallback chain `locale → en → hy`. Replaces
  the ad-hoc `.hy || .en` pattern everywhere.
- **`MultiLang`** type gains `ru?: string`.
- **Locale resolution** unchanged in mechanism: URL prefix (`/en`, `/ru`) →
  `X-NEXT-INTL-LOCALE` header via `src/proxy.ts` → `NEXT_LOCALE` cookie → forwarded to
  the API as `Accept-Language`.
- **Backend**: `SetLocale` supported list + `users.locale` enum + the 12 translatable
  Form Requests all extended to include `ru`. Content columns need no migration.
- **Emails**: move from binary `hy ? … : en` to a 3-locale lookup.

---

## Phases

| # | Phase | Status | Commit |
|---|-------|--------|--------|
| 1a | Foundation — `pickLang` helper, `MultiLang.ru`, routing/proxy/request/switcher +`ru`, `ru.json` (130 keys) | ✅ Done & live | `375ef0a` |
| 1b | Locale-aware content display — converted customer-facing `name.hy \|\| en` sites to `pickLang` (20 files: spark+minimal+_shared templates, store pages, store metadata/JSON-LD, StoreCard/StoreFilters/StaticPageContent/OrderConfirmation) | ✅ Done & live | `b697d19` |
| 2 | Backend Russian support (SetLocale, `users.locale` enum migration, 12 Form Requests, `in:` rule, locale-aware payment description) | ✅ Done & live | `4137cef` |
| 3a | RU content-entry: **ProductForm** (3-lang name + lang-driven descriptions/SEO tabs) | ✅ Done & live | `3272c71` |
| 3b | RU content-entry: StoreSettings + StoreSetupWizard (store name/description/meta) | ✅ Done & live | `e56708a` |
| 3c | RU content-entry: admin Categories + PageEditor + CreateSeller locale picker (Payments deferred — see note) | ✅ Done & live | `d634dfd` |
| 4a | UI strings: spark shell (ProductCard, ProductGrid, CartDrawer, StoreHeader, StoreFooter) → new `storefront` catalog namespace | ✅ Done & live | `189beb1` |
| 4b | UI strings: spark CheckoutForm (incl. translated Zod validation via in-component schema) | ✅ Done & live | `2cf7ad8` |
| 4b-home | UI strings: spark StoreHome (hero, trust/marquee, section headings) | ✅ Done & live | `c7fa1a6` |
| 4c | UI strings: minimal template (ProductCard, ProductGrid, StoreHeader, StoreHome — reuses `storefront` catalog; CartDrawer/CheckoutForm/ProductDetail re-export `_shared`) | ✅ Done & live | `59782ea` |
| 4d-shared | UI strings: `_shared` trio — CartDrawer, ProductDetail, CheckoutForm (used by minimal; reuse `storefront` catalog + 4 new keys) | ✅ Done & live | `b3eabc8` |
| 4d-pages-1 | UI strings: products listing page + checkout-failed page + SearchInput/PriceRangeFilter (`filters`, `payFailed` catalog) | ✅ Done & live | `53e9f70` |
| 4d-pages-2 | UI strings: OrderConfirmation (status timeline/labels via key maps) + ReviewSection (`orderStatus`/`orderTimeline`/`order`/`reviews` catalog) | ✅ Done & live | `ee542ac` |
| 5 | Trilingual transactional emails — `lang/{hy,en,ru}/emails.php` (62 keys), 7 notifications + 7 blades to `__()`, `orders.locale` capture drives customer emails, status-label map | ✅ Done | `53aeb1a` |
| 6 | SEO (locale-aware JSON-LD/OG, `hreflang`) + full verify sweep | ⏳ Planned | — |

Legend: ✅ done & live · 🔧 in progress · ⏳ planned

---

## Phase deliverables (detail)

### Phase 1 — Foundation & locale-aware display
- `src/types/index.ts` — `MultiLang` += `ru?: string`.
- `src/lib/i18n.ts` — new `pickLang(field, locale)` helper (chain: locale → en → hy).
- `src/i18n/routing.ts`, `src/i18n/request.ts` — add `ru` to locales / widen casts.
- `src/proxy.ts` — add `ru` to `LOCALES` and the prefix regex.
- `src/components/ui/LanguageSwitcher.tsx` — add RU. **Super-admin requirement already satisfied:** the switcher renders only in the public marketing `Navbar`/`Footer`, never in the admin (or seller) area, so a super admin never sees it. (Documented so it stays true if a shared layout ever adds it.)
- `src/messages/ru.json` — translated the 130 existing UI keys. The `features.multilang` marketing card was updated in all 3 catalogs to advertise trilingual support.
- Convert customer-facing `name.hy || name.en` content sites to `pickLang(...)` (Phase 1b).

### Phase 2 — Backend Russian support
- `app/Http/Middleware/SetLocale.php` — `SUPPORTED += 'ru'`.
- New migration — extend `users.locale` enum to include `ru`.
- `app/Http/Controllers/Admin/SellerController.php` — `in:hy,en` → `in:hy,en,ru`.
- 12 translatable Form Requests — accept `*.ru` (nullable).
- Tighten hardcoded `getTranslation(…,'hy'|'en')` display fallbacks. + tests.

### Phase 3 — Russian content-entry forms
- `ProductForm`, `StoreSettingsClient`, `PageEditorClient`, `PaymentsAdminClient`,
  `CreateSellerClient` — add Russian input/tab; widen `'hy'|'en'` toggle + payloads.

### Phase 4 — Translate customer-facing UI
- Extract hardcoded strings from `src/templates/**` (spark + minimal) and
  `src/components/store/**` + `src/app/(store)/**` into new catalog namespaces; wire
  `useTranslations`/`getTranslations`; translate hy/en/ru.

### Phase 5 — Trilingual transactional emails
- New `lang/{hy,en,ru}/emails.php` (62 keys, full parity) + `config('app.supported_locales')`
  (env `APP_SUPPORTED_LOCALES`). 7 notifications + 7 blades refactored from inline `hy/en`
  ternaries to `__('emails.*', …, $locale)` via a shared `ResolvesLocale` concern. Customer
  emails (confirmation, status-changed) now honour the buyer's checkout locale via a new
  `orders.locale` column captured in `CreateOrderAction`; seller/admin emails use
  `users.locale`. Shared `emails.status` label map. `ContactMessageNotification` stays
  English (internal admin alert).

### Phase 6 — SEO + verify
- Locale-aware JSON-LD/OG names via `pickLang`; `alternates.languages` (hreflang) for
  hy/en/ru; full `tsc` + `next build` + test sweep.

---

## Progress log

- **2026-05-30** — Plan approved (customer-facing first; full RU authoring; fallback
  visitor→en→hy; super-admin EN-only, no switcher). Phase 1 started.
- **2026-05-30** — Phase 1a (foundation) done: `MultiLang.ru`, `pickLang` helper
  (`src/lib/i18n.ts`), `ru` added to routing/request/proxy/`LanguageSwitcher`, and
  `src/messages/ru.json` (130 keys, full parity with en/hy verified). Confirmed the
  super-admin never sees the switcher (it lives only in the marketing Navbar/Footer).
  `tsc` clean; production `next build` passes. → marketing site is now fully trilingual.
  Next: Phase 1b (`pickLang` content-site conversion).
- **2026-05-30** — Phase 1a deployed (`375ef0a`) and verified live: `/ru` renders the
  homepage in Russian (`<html lang="ru">`); `/` still Armenian. No regression.
- **2026-05-30** — Phase 1b done: converted all customer-facing catalog content-display
  sites (20 files) from `name.hy || name.en` to locale-aware `pickLang(...)` — storefront
  templates (spark/minimal/_shared), customer store pages, store/product `generateMetadata`
  + JSON-LD, StoreCard/StoreFilters/StaticPageContent/OrderConfirmation. Client components
  use `useLocale()`; server pages use `getLocale()`. The two `StoreFooter` server
  components were marked `'use client'` (they render inside `StoreLayoutClient`). Fixes the
  long-standing bug where EN visitors saw Armenian content; RU visitors now get RU content
  (fallback ru→en→hy). `tsc` clean; production build passes. **Note:** seller/admin internal
  content-display still uses the old pattern — deferred (dashboards are English-chrome,
  out of customer-facing scope). NEXT: Phase 2 (backend RU support).
- **2026-05-30** — Phase 2 done: `SetLocale` accepts `ru`; migration extends the
  `users.locale` enum to `['hy','en','ru']` (via `->change()`, works on MySQL + the
  SQLite test DB); admin seller `locale` rule `in:hy,en,ru`; all 12 translatable Form
  Requests (+ inline admin page-create) accept nullable `*.ru`; payment-description store
  name is now locale-aware (locale→en→hy). Added SetLocale unit tests + a Russian
  product-authoring feature test. Full suite: 239 tests / 691 assertions. NEXT: Phase 3
  (Russian content-entry forms in the frontend).
- **2026-05-30** — Phase 3a done: `ProductForm` now authors all three languages. Added a
  🇷🇺 Russian Name input (3-col grid), refactored the Descriptions and SEO sections from a
  binary `hy/en` ternary into a clean lang-driven render (tabs from `LANG_TABS`, inputs via
  dynamic `register(\`field_${lang}\`)`, full-description + SEO-preview via per-lang maps).
  Schema/defaults/FormData-submit all carry `*_ru` (RU optional). `tsc` clean; production
  build passes. NEXT: 3b (store forms), then 3c (admin forms + CreateSeller locale picker).
- **2026-05-30** — Phase 3b done: `StoreSettingsClient` (controlled MultiLang state — name,
  description, meta_title, meta_description now have 🇷🇺 inputs; `buildFormData` appends
  `[ru]`) and `StoreSetupWizard` (RHF — `name_ru`/`description_ru` schema, inputs, submit).
  `tsc` clean; production build passes. NEXT: 3c (admin Categories/PageEditor/Payments +
  CreateSeller locale picker).
- **2026-05-30** — Phase 3c done: `CategoriesAdminClient` (🇷🇺 name input, payload appends
  `name.ru`), `PageEditorClient` (refactored binary `hy/en` ternaries to lang-keyed maps;
  added a third TipTap editor + RU title/content/meta), and `CreateSellerClient` (locale
  picker now offers Russian — backend accepts it after Phase 2). `tsc` clean; production
  build passes. **Payments form DEFERRED**: `PaymentsAdminClient` has a pre-existing
  wiring bug — it reads/writes `gw.name` (a plain string identifier column) as if it were
  the translatable display name, while the real translatable field is `display_name` (never
  touched by the form). Adding `ru` there is meaningless until that's fixed; tracked as a
  separate bug, not part of i18n. **Phase 3 (RU content authoring) complete.** NEXT: Phase 4
  (translate customer-facing UI strings).
- **2026-05-30** — Phase 4a done: created the `storefront` catalog namespace (22 keys incl.
  a `cart` sub-object, with a `t.rich` free-shipping message) in all 3 catalogs (152 keys
  each, full parity), and wired `useTranslations('storefront')` into the spark shell —
  ProductCard, ProductGrid, CartDrawer, StoreHeader, StoreFooter. `tsc` clean; production
  build passes. Phase 4 is large, so split: 4b = spark CheckoutForm + StoreHome; 4c = minimal
  template; 4d = `_shared` + customer store pages.
- **2026-05-30** — Phase 4b done (CheckoutForm): extended `storefront.checkout` catalog
  (~36 keys, hy/en/ru, 189 total, full parity). Wired CheckoutForm — moved the Zod schema
  inside the component (`useMemo` + `t`) so validation messages translate, dropped the
  garbled transliterated GATEWAY_META descriptions, and translated all labels/placeholders/
  step indicators/order-summary/buttons. `tsc` clean; production build passes. Split out
  StoreHome (4b-home) for quality — it has module-level TRUST/MARQUEE consts + many section
  headings. NEXT: 4b-home, then 4c (minimal), 4d (`_shared` + store pages).
- **2026-05-30** — Phase 4b-home done: added the `storefront.home` catalog (incl. `trust` +
  `marquee` sub-objects, hy/en/ru, 209 keys total, full parity) and fully localized spark
  StoreHome — module-level TRUST/MARQUEE consts changed to catalog keys (resolved via `t` in
  the relevant components), CategoryCards/FeaturedSpotlight/SectionHeading/hero/section
  headings all wired. The whole spark template is now trilingual. `tsc` clean; production
  build passes. NEXT: 4c (minimal template), 4d (`_shared` + customer store pages).
- **2026-05-30** — Phase 4c done (minimal template): wired `useTranslations('storefront')`
  into minimal's own components (ProductCard, ProductGrid, StoreHeader, StoreHome), reusing
  the shared `storefront` catalog + 2 new keys (`home.products`, `home.seeAll`); 211 keys
  each, full parity. Discovered minimal's CartDrawer/CheckoutForm/ProductDetail are thin
  re-exports of `_shared` (so they belong to 4d). `tsc` clean; production build passes.
  NEXT: 4d (`_shared` ProductDetail + CartDrawer + customer store pages + ReviewSection).
- **2026-05-30** — Phase 4d-shared done: localized the `_shared` trio (CartDrawer,
  ProductDetail, CheckoutForm — all used by the minimal template). Reused the `storefront`
  catalog + 4 new keys (`breadcrumbHome`, `description`, `checkout.qty`, `checkout.placeOrder`);
  215 keys each, full parity. The `_shared` CheckoutForm got the same in-component `useMemo`
  Zod schema refactor as spark's so validation messages translate, and its gateway labels
  were normalized to brand names. `tsc` clean; production build passes. The minimal template
  is now fully trilingual.
- **2026-05-30** — Phase 4d-pages-1 done: added `storefront.filters` + `payFailed` +
  `searchPlaceholder` catalog (hy/en/ru, 230 keys, full parity); wired the products listing
  page (sort options, category/filter chips, product count, pagination via `getTranslations`),
  the checkout-failed page, and the SearchInput + PriceRangeFilter client controls. Note: the
  `checkout/{failed,sandbox,success}` dirs were root-owned (early scaffold) — chowned to
  deploy. `tsc` clean; production build passes. NEXT: 4d-pages-2 (OrderConfirmation status
  timeline/labels + ReviewSection).
- **(superseded note)** earlier 4d-pages plan: (products listing, checkout result pages,
  OrderConfirmation, ReviewSection, filter controls).
- **2026-05-31** — Phase 4d-pages-2 done & live (`ee542ac`): OrderConfirmation (status
  timeline/labels via key maps) + ReviewSection wired to `storefront.{orderStatus,
  orderTimeline,order,reviews}` (266 keys, full parity). `tsc` clean; production build passes.
  **Phase 4 complete** — the whole customer-facing UI surface is trilingual.
- **2026-05-31** — Phase 5 done: transactional emails are now trilingual. Added
  `lang/{hy,en,ru}/emails.php` (62 keys, full parity) and `config('app.supported_locales')`
  (env-driven, also adopted by `SetLocale`). Refactored all 7 locale-aware notifications
  (`CustomerOrderConfirmation`, `NewOrder`, `OrderStatusChanged`, `StoreApproved`,
  `StoreSuspended`, `WelcomeSeller`, `OrdersExported`) + 7 blades (layout + 6 content) from
  inline `hy/en` ternaries to `__('emails.*', …, $locale)` via a shared `ResolvesLocale`
  concern. `order-confirmation.blade` was previously English-only — now fully localized,
  including locale-aware item names. New `orders.locale` column (migration) captured in
  `CreateOrderAction` from the request locale drives the two customer emails (fallback
  order→notifiable→`config('app.locale')`); seller/admin emails use `users.locale`. Shared
  `emails.status` label map for the 7 order statuses. `ContactMessageNotification` left
  English (internal admin alert). New `EmailLocalizationTest` (8 tests) renders every
  notification in `ru`, asserts the order-locale-driven customer flow, the status-label
  translation, and the missing-locale fallback. Full suite: **247 tests / 712 assertions**.
  NEXT: Phase 6 (SEO — locale-aware JSON-LD/OG + hreflang + full verify sweep).
