<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Repositories\Contracts\BlogCommentRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class BlogCommentController extends Controller
{
    public function __construct(private readonly BlogCommentRepositoryInterface $comments) {}

    public function index(string $slug): JsonResponse
    {
        $post = Post::published()->where('slug', $slug)->first();
        if (!$post) {
            return $this->error('Post not found.', 404);
        }

        $data = Cache::remember(
            "blog:post:{$slug}:comments",
            60,
            fn () => $this->comments->approvedForPost($post->id)
        );

        return $this->success($data);
    }

    public function store(Request $request, string $slug): JsonResponse
    {
        $post = Post::published()->where('slug', $slug)->first();
        if (!$post) {
            return $this->error('Post not found.', 404);
        }

        $data = $request->validate([
            'author_name'           => ['required', 'string', 'max:100'],
            'author_email'          => ['nullable', 'email', 'max:200'],
            'body'                  => ['required', 'string', 'min:2', 'max:2000'],
            'cf_turnstile_response' => ['nullable', 'string'],
            'captcha_token'         => ['nullable', 'string'],
            'captcha_answer'        => ['nullable', 'string'],
        ]);

        $this->verifySpamProtection($request);

        if (!empty($data['author_email'])
            && $this->comments->existsRecentByEmailAndPost($post->id, $data['author_email'])) {
            throw ValidationException::withMessages([
                'author_email' => ['You have already commented on this post recently.'],
            ]);
        }

        $this->comments->create([
            'post_id'      => $post->id,
            'author_name'  => $data['author_name'],
            'author_email' => $data['author_email'] ?? null,
            'body'         => $data['body'],
            'is_approved'  => false,
            'ip_address'   => $request->ip(),
        ]);

        return $this->success(null, 'Comment submitted and pending approval.', 201);
    }

    /**
     * Same spam stack as Store\ProductReviewController: Cloudflare Turnstile when
     * configured, otherwise the built-in numeric image captcha (CaptchaController).
     */
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

        $token  = $request->input('captcha_token', '');
        $answer = $request->input('captcha_answer', '');
        if (!$token || !$answer || !CaptchaController::verify($token, $answer)) {
            throw ValidationException::withMessages(['captcha' => ['Incorrect captcha answer. Please try again.']]);
        }
    }
}
