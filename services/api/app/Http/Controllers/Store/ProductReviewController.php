<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\CaptchaController;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class ProductReviewController extends Controller
{
    public function store(Request $request, string $slug, string $productSlug): JsonResponse
    {
        $store = $request->attributes->get('currentStore');

        $product = Product::where('store_id', $store->id)
            ->where('slug', $productSlug)
            ->where('status', 'active')
            ->firstOrFail();

        $data = $request->validate([
            'reviewer_name'  => ['required', 'string', 'max:100'],
            'reviewer_email' => ['nullable', 'email', 'max:200'],
            'rating'         => ['required', 'integer', 'min:1', 'max:5'],
            'body'           => ['nullable', 'string', 'max:2000'],
            // spam protection fields
            'cf_turnstile_response' => ['nullable', 'string'],
            'captcha_token'         => ['nullable', 'string'],
            'captcha_answer'        => ['nullable', 'string'],
        ]);

        $this->verifySpamProtection($request);

        // prevent duplicate review from same email
        if (!empty($data['reviewer_email'])) {
            $exists = ProductReview::where('product_id', $product->id)
                ->where('reviewer_email', $data['reviewer_email'])
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'reviewer_email' => ['You have already reviewed this product.'],
                ]);
            }
        }

        ProductReview::create([
            'store_id'       => $store->id,
            'product_id'     => $product->id,
            'reviewer_name'  => $data['reviewer_name'],
            'reviewer_email' => $data['reviewer_email'] ?? null,
            'rating'         => $data['rating'],
            'body'           => $data['body'] ?? null,
            'is_approved'    => false,
        ]);

        return $this->success(null, 'Review submitted and pending approval.');
    }

    private function verifySpamProtection(Request $request): void
    {
        $turnstileSecret = config('services.turnstile.secret');

        if ($turnstileSecret) {
            $token = $request->input('cf_turnstile_response');
            if (!$token) {
                throw ValidationException::withMessages(['captcha' => ['Please complete the captcha.']]);
            }
            $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret'   => $turnstileSecret,
                'response' => $token,
                'remoteip' => $request->ip(),
            ]);
            if (!$response->json('success')) {
                throw ValidationException::withMessages(['captcha' => ['Captcha verification failed.']]);
            }
            return;
        }

        // fallback: image captcha
        $token  = $request->input('captcha_token', '');
        $answer = $request->input('captcha_answer', '');
        if (!$token || !$answer || !CaptchaController::verify($token, $answer)) {
            throw ValidationException::withMessages(['captcha' => ['Incorrect captcha answer. Please try again.']]);
        }
    }
}
