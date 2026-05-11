<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTemplateRequest;
use App\Http\Requests\Admin\UpdateTemplateRequest;
use App\Http\Resources\Admin\TemplateResource;
use App\Models\StoreTemplate;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function __construct(private readonly ImageService $imageService) {}

    public function index(): JsonResponse
    {
        $templates = StoreTemplate::withCount('stores')
            ->orderBy('sort_order')
            ->get();

        return $this->success(TemplateResource::collection($templates));
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $template = StoreTemplate::create($request->validated());

        return $this->success(new TemplateResource($template), 'Template created.', 201);
    }

    public function update(UpdateTemplateRequest $request, StoreTemplate $template): JsonResponse
    {
        $template->update($request->validated());

        return $this->success(new TemplateResource($template->fresh()), 'Template updated.');
    }

    public function uploadImage(Request $request, StoreTemplate $template): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,webp,gif', 'max:10240'],
        ]);

        $variants = $this->imageService->process($request->file('image'), 'admin');

        $template->update(['preview_image' => $variants['original']]);

        return $this->success(['preview_image' => $template->preview_image], 'Image uploaded.');
    }

    public function toggle(StoreTemplate $template): JsonResponse
    {
        $template->update(['is_active' => !$template->is_active]);

        $message = $template->is_active ? 'Template activated.' : 'Template deactivated.';

        return $this->success(new TemplateResource($template->fresh()), $message);
    }
}
