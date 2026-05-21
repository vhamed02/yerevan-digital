<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTemplateRequest;
use App\Http\Requests\Admin\UpdateTemplateRequest;
use App\Http\Resources\Admin\TemplateResource;
use App\Models\StoreTemplate;
use App\Repositories\Contracts\StoreTemplateRepositoryInterface;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function __construct(
        private readonly StoreTemplateRepositoryInterface $templates,
        private readonly ImageService                     $imageService,
    ) {}

    public function index(): JsonResponse
    {
        return $this->success(TemplateResource::collection($this->templates->allOrdered()));
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $template = $this->templates->create($request->validated());

        return $this->success(new TemplateResource($template), 'Template created.', 201);
    }

    public function update(UpdateTemplateRequest $request, StoreTemplate $template): JsonResponse
    {
        $updated = $this->templates->update($template, $request->validated());

        return $this->success(new TemplateResource($updated), 'Template updated.');
    }

    public function uploadImage(Request $request, StoreTemplate $template): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,webp,gif', 'max:10240'],
        ]);

        $variants = $this->imageService->process($request->file('image'), 'admin');
        $this->templates->update($template, ['preview_image' => $variants['original']]);

        return $this->success(['preview_image' => $template->fresh()->preview_image], 'Image uploaded.');
    }

    public function toggle(StoreTemplate $template): JsonResponse
    {
        $updated = $this->templates->toggle($template);

        $message = $updated->is_active ? 'Template activated.' : 'Template deactivated.';

        return $this->success(new TemplateResource($updated), $message);
    }
}
