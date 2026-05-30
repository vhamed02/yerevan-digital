# Vendora — Multilingual System (HY · EN · RU)

> **Living document.** Kept up to date as work progresses. Each phase updates the
> status table, the progress log, and any decisions that change.
> Last updated: 2026-05-30 · Status: **Phase 1 in progress**

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
| 1b | Locale-aware content display — convert ~120 `name.hy \|\| en` sites to `pickLang` (customer-facing first) | 🔧 In progress | — |
| 2 | Backend Russian support (SetLocale, `users.locale` enum migration, 12 Form Requests, `in:` rule) | ⏳ Planned | — |
| 3 | Russian content-entry forms (Product/Store/Page/Payments/Seller — 3rd language tab) | ⏳ Planned | — |
| 4 | Translate customer-facing UI (storefront templates + customer store pages → catalog + `useTranslations`) | ⏳ Planned | — |
| 5 | Trilingual transactional emails (7 notifications + 8 blade templates) | ⏳ Planned | — |
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
- 7 notification classes + 8 blade templates → 3-locale lookup (incl. status-label map,
  email `lang`/`dir`).

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
