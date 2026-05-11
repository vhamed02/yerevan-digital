<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    public function __construct(private readonly ImageService $imageService) {}

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,webp,gif', 'max:10240'],
        ]);

        $variants = $this->imageService->process($request->file('image'), 'admin');

        return $this->success($variants, 'Uploaded.', 201);
    }
}
