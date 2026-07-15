# Custom storefront domains

A seller points their own domain (`shop.example.am`) at the platform and it serves their
storefront. Added 2026-07-15.

## Request path

```
visitor → seller's Cloudflare (TLS) → :80 host nginx → :8088 docker nginx → web (Next.js)
                                          ↑                                      ↓
                                  catch-all server block            proxy.ts resolves Host → slug
                                                                    rewrites / → /store/<slug>
```

1. **Host nginx** (`/etc/nginx/sites-available/vendora`) has a `default_server` catch-all that
   proxies any unrecognised Host into the stack. The bare server IP is matched by an *exact*
   `server_name 51.68.174.251` block first, so it still serves the static "server is up" page.
2. **`proxy.ts`** (Next.js — note: `proxy`, not `middleware`, in Next 16) takes the Host, skips
   platform hosts and `/admin|/seller|/auth|/api`, and calls
   `GET /api/v1/domains/resolve?host=…`. A hit rewrites `/x` → `/store/<slug>/x`.
   Results are cached in-process for 60s, **including negatives** — an unmapped host must not
   query the API on every request. A resolver failure falls through to normal routing rather
   than erroring.
3. **`DomainService::resolveSlug()`** only returns a slug when the domain is **verified** and the
   store is **active**, and caches the slug string (never the model — see the Redis rule in
   `CLAUDE.md`). `StoreObserver` busts that cache, so suspending a store takes a domain down
   immediately rather than after the TTL.

## Verification

Ownership is proven with a TXT record before anything routes — otherwise typing someone's
hostname into the box would be enough to serve content on it.

| Record | Name | Value |
|--------|------|-------|
| TXT | `_yerevan-verify.shop.example.am` | the store's `custom_domain_token` |
| A | `shop.example.am` | `51.68.174.251` (`config('domains.origin_ip')`) |

Claiming or re-claiming a domain always re-issues the token and clears
`custom_domain_verified_at` — a domain moving between stores must not inherit the previous
owner's proof.

## TLS — the part that isn't code

**nginx here listens on :80 only.** TLS for `yerevan.digital` is terminated by *our* Cloudflare
(Flexible SSL). We hold no certificates and there is no certbot on this box.

So a custom domain gets HTTPS by the seller putting it behind **their own Cloudflare account**
(free plan, proxy enabled, A record → `51.68.174.251`). Their Cloudflare issues the certificate
and connects to us over HTTP:80. This is what the seller UI instructs, and it needs nothing
from us.

Without that, the domain answers on `http://` only. Alternatives, if this ever needs to work
for sellers who won't use Cloudflare:

| Option | Cost | Notes |
|--------|------|-------|
| Seller's own Cloudflare | free | **current approach** — zero cert management for us |
| Cloudflare for SaaS (Custom Hostnames) | paid | cleanest at scale; needs a CF API integration to add hostnames |
| Let's Encrypt + certbot on host nginx | free | works for any DNS provider, but we own renewal, and port 80 must reach us directly (not through the seller's CF) |

A **CNAME to `yerevan.digital` does not work** — that resolves to our Cloudflare, which has no
custom hostname for the seller's domain and will answer with a 1014/1016 error. Use the A record.

## Gotchas

- The host nginx catch-all is a **production infra file, not in this repo** — it is not restored
  by a deploy. A backup of the pre-change version is at `/root/vendora.bak.*`.
- `sites-enabled/` is `include`d wholesale: never leave a `.bak` copy there or nginx loads it as
  a second config and fails on duplicate server blocks.
- Reserved hosts live in `config/domains.php` and are mirrored in `proxy.ts` (`PLATFORM_HOSTS`).
  Both need updating if the platform gains a hostname.
