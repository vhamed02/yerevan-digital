<?php

namespace App\Services;

use App\Enums\StoreStatus;
use App\Models\Store;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Custom storefront domains.
 *
 * A seller claims a domain, proves ownership with a TXT record, and only then
 * does the domain resolve to their storefront. Nothing routes on an unverified
 * domain — otherwise claiming someone else's hostname would be enough to serve
 * content on it.
 */
class DomainService
{
    /** Strip protocol, port, path, trailing dot and case from user input. */
    public function normalise(string $host): string
    {
        $host = trim($host);
        $host = preg_replace('#^https?://#i', '', $host) ?? $host;
        $host = explode('/', $host)[0];
        $host = explode(':', $host)[0];

        return rtrim(mb_strtolower($host), '.');
    }

    public function isReserved(string $host): bool
    {
        return in_array($this->normalise($host), config('domains.reserved', []), true);
    }

    public function isValidHostname(string $host): bool
    {
        $host = $this->normalise($host);

        // Must be a dotted hostname: labels of alphanumerics/hyphens, a real TLD,
        // and no leading/trailing hyphen in any label.
        return (bool) preg_match(
            '/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/',
            $host
        ) && strlen($host) <= 253;
    }

    public function generateToken(): string
    {
        return Str::random(40);
    }

    /** The TXT record name the seller must create. */
    public function verificationRecordName(string $host): string
    {
        return config('domains.verification_prefix') . '.' . $this->normalise($host);
    }

    /**
     * Look for the store's token in the domain's TXT records.
     *
     * Returns false rather than throwing on DNS failure — an unreachable or
     * not-yet-propagated domain is simply "not verified yet".
     */
    public function verifyOwnership(Store $store): bool
    {
        if ($store->custom_domain === null || $store->custom_domain_token === null) {
            return false;
        }

        foreach ($this->lookupTxt($this->verificationRecordName($store->custom_domain)) as $value) {
            if (hash_equals($store->custom_domain_token, trim($value))) {
                return true;
            }
        }

        return false;
    }

    /** @return string[] */
    public function lookupTxt(string $recordName): array
    {
        $records = @dns_get_record($recordName, DNS_TXT);

        if ($records === false) {
            return [];
        }

        return collect($records)
            ->pluck('txt')
            ->filter()
            ->map(fn ($txt) => (string) $txt)
            ->all();
    }

    /**
     * Host -> store slug for the storefront proxy, or null when the host isn't a
     * live custom domain. Cached: this is hit on every storefront request.
     *
     * Only the slug string is cached — never the model (it would come back as
     * __PHP_Incomplete_Class from Redis).
     */
    public function resolveSlug(string $host): ?string
    {
        $host = $this->normalise($host);

        if ($host === '' || $this->isReserved($host)) {
            return null;
        }

        // Platform subdomain (<slug>.yerevan.digital): served for free, no claim
        // or verification — matched by slug on any Active store.
        $label = $this->platformSubdomainLabel($host);

        $cached = Cache::remember(
            $this->cacheKey($host),
            config('domains.resolve_cache_ttl'),
            fn () => ($label !== null
                ? Store::query()
                    ->where('slug', $label)
                    ->where('status', StoreStatus::Active)
                    ->value('slug')
                : Store::query()
                    ->where('custom_domain', $host)
                    ->whereNotNull('custom_domain_verified_at')
                    ->where('status', StoreStatus::Active)
                    ->value('slug')
            ) ?? '',
        );

        // '' is the cached "no such domain", so a miss doesn't re-query every hit.
        return $cached === '' ? null : $cached;
    }

    /**
     * If $host is a direct `<label>.<platform_host>` subdomain that is eligible
     * to serve a store, return the label; otherwise null (the apex itself, a
     * reserved label like www/api, or a deeper name such as a.b.yerevan.digital).
     */
    private function platformSubdomainLabel(string $host): ?string
    {
        $platform = mb_strtolower(trim((string) config('domains.platform_host')));

        if ($platform === '' || ! str_ends_with($host, '.' . $platform)) {
            return null;
        }

        $label = substr($host, 0, -(strlen($platform) + 1));

        // Single label only, and never a reserved/platform-owned subdomain.
        if ($label === '' || str_contains($label, '.')) {
            return null;
        }

        if (in_array($label, config('domains.reserved_subdomains', []), true)) {
            return null;
        }

        return $label;
    }

    public function forget(?string $host): void
    {
        if ($host === null || $host === '') {
            return;
        }

        Cache::forget($this->cacheKey($this->normalise($host)));
    }

    private function cacheKey(string $host): string
    {
        return 'domain:resolve:' . $host;
    }
}
