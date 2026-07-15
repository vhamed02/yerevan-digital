<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Services\DomainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DomainController extends Controller
{
    public function __construct(private readonly DomainService $domains) {}

    public function show(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (! $store) {
            return $this->error('You have not created a store yet.', 404);
        }

        return $this->success($this->payload($store));
    }

    /** Claim a domain. Always lands unverified — proving ownership is a separate step. */
    public function update(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (! $store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $validated = $request->validate([
            'custom_domain' => ['required', 'string', 'max:253'],
        ]);

        $host = $this->domains->normalise($validated['custom_domain']);

        if (! $this->domains->isValidHostname($host)) {
            return $this->error('That does not look like a valid domain name.', 422, [
                'custom_domain' => ['Enter a domain such as shop.example.am.'],
            ]);
        }

        if ($this->domains->isReserved($host)) {
            return $this->error('That domain is reserved by the platform.', 422, [
                'custom_domain' => ['This domain cannot be used.'],
            ]);
        }

        $takenByAnother = Store::where('custom_domain', $host)
            ->whereKeyNot($store->id)
            ->exists();

        if ($takenByAnother) {
            return $this->error('That domain is already in use by another store.', 422, [
                'custom_domain' => ['This domain is already taken.'],
            ]);
        }

        $previous = $store->custom_domain;

        $store->update([
            'custom_domain'             => $host,
            // Re-issue the token on every claim: a domain moving between stores
            // must not inherit the previous owner's proof.
            'custom_domain_token'       => $this->domains->generateToken(),
            'custom_domain_verified_at' => null,
        ]);

        $this->domains->forget($previous);
        $this->domains->forget($host);

        return $this->success($this->payload($store->fresh()), 'Domain saved. Add the TXT record, then verify.');
    }

    public function verify(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (! $store) {
            return $this->error('You have not created a store yet.', 404);
        }

        if ($store->custom_domain === null) {
            return $this->error('Set a domain first.', 422);
        }

        if (! $this->domains->verifyOwnership($store)) {
            return $this->error(
                'We could not find the TXT record yet. DNS changes can take a few minutes to propagate.',
                422,
                ['custom_domain' => ['Verification record not found.']],
            );
        }

        $store->update(['custom_domain_verified_at' => now()]);
        $this->domains->forget($store->custom_domain);

        return $this->success($this->payload($store->fresh()), 'Domain verified. Your storefront is now live on it.');
    }

    public function destroy(Request $request): JsonResponse
    {
        $store = $request->attributes->get('sellerStore');
        if (! $store) {
            return $this->error('You have not created a store yet.', 404);
        }

        $previous = $store->custom_domain;

        $store->update([
            'custom_domain'             => null,
            'custom_domain_token'       => null,
            'custom_domain_verified_at' => null,
        ]);

        $this->domains->forget($previous);

        return $this->success($this->payload($store->fresh()), 'Domain removed.');
    }

    private function payload(Store $store): array
    {
        return [
            'custom_domain' => $store->custom_domain,
            'verified'      => $store->hasVerifiedDomain(),
            'verified_at'   => $store->custom_domain_verified_at?->toIso8601String(),
            'dns' => $store->custom_domain === null ? null : [
                'txt_name'  => $this->domains->verificationRecordName($store->custom_domain),
                'txt_value' => $store->custom_domain_token,
                'a_record'  => config('domains.origin_ip'),
            ],
        ];
    }
}
