<?php

namespace App\Http\Controllers;

use App\Services\DomainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DomainController extends Controller
{
    public function __construct(private readonly DomainService $domains) {}

    /**
     * Host -> store slug, for the storefront proxy. Deliberately minimal: it is
     * called on storefront requests and leaks nothing beyond "this domain maps
     * to this public store slug".
     */
    public function resolve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'host' => ['required', 'string', 'max:253'],
        ]);

        $slug = $this->domains->resolveSlug($validated['host']);

        if ($slug === null) {
            return $this->error('No store is served on this domain.', 404);
        }

        return $this->success(['slug' => $slug]);
    }
}
