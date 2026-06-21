<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogComment;
use App\Repositories\Contracts\BlogCommentRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BlogCommentController extends Controller
{
    public function __construct(private readonly BlogCommentRepositoryInterface $comments) {}

    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status', 'pending');
        $page   = (int) $request->input('page', 1);

        $paginator = $this->comments->adminPage($status, 25, $page);

        $data = $paginator->map(fn (BlogComment $c) => [
            'id'           => $c->id,
            'author_name'  => $c->author_name,
            'author_email' => $c->author_email,
            'body'         => $c->body,
            'is_approved'  => $c->is_approved,
            'created_at'   => $c->created_at->toDateTimeString(),
            'post'         => [
                'slug'  => $c->post?->slug,
                'title' => $c->post?->title,
            ],
        ])->values()->all();

        return $this->success([
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    public function approve(BlogComment $comment): JsonResponse
    {
        $this->comments->approve($comment);

        if ($comment->post) {
            Cache::forget("blog:post:{$comment->post->slug}:comments");
        }

        return $this->success(null, 'Comment approved.');
    }

    public function destroy(BlogComment $comment): JsonResponse
    {
        $slug = $comment->post?->slug;

        $this->comments->delete($comment);

        if ($slug) {
            Cache::forget("blog:post:{$slug}:comments");
        }

        return $this->success(null, 'Comment deleted.');
    }
}
