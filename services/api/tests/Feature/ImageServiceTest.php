<?php

namespace Tests\Feature;

use App\Jobs\ProcessImageVariants;
use App\Services\ImageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageServiceTest extends TestCase
{
    private ImageService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->service = new ImageService();
    }

    public function test_process_creates_three_webp_variants_without_full_res_original(): void
    {
        $file   = UploadedFile::fake()->image('test.jpg', 800, 600);
        $result = $this->service->process($file, 'products', '1');

        $uuid = $result['uuid'];

        Storage::disk('public')->assertExists("images/products/1/{$uuid}/thumbnail.webp");
        Storage::disk('public')->assertExists("images/products/1/{$uuid}/medium.webp");
        Storage::disk('public')->assertExists("images/products/1/{$uuid}/large.webp");
        Storage::disk('public')->assertMissing("images/products/1/{$uuid}/original.webp");
    }

    public function test_process_points_original_url_at_large(): void
    {
        $file   = UploadedFile::fake()->image('test.jpg', 800, 600);
        $result = $this->service->process($file, 'products', '1');

        $this->assertSame($result['large'], $result['original']);
    }

    public function test_process_returns_webp_mime(): void
    {
        $file   = UploadedFile::fake()->image('photo.png', 400, 300);
        $result = $this->service->process($file, 'misc');

        $this->assertEquals('image/webp', $result['mime']);
    }

    public function test_process_returns_original_dimensions(): void
    {
        $file   = UploadedFile::fake()->image('photo.jpg', 800, 600);
        $result = $this->service->process($file, 'misc');

        $this->assertEquals(800, $result['width']);
        $this->assertEquals(600, $result['height']);
    }

    public function test_process_returns_file_size(): void
    {
        $file   = UploadedFile::fake()->image('photo.jpg', 100, 100);
        $result = $this->service->process($file, 'misc');

        $this->assertGreaterThan(0, $result['size']);
    }

    public function test_process_builds_path_with_store_id(): void
    {
        $file   = UploadedFile::fake()->image('store.jpg', 200, 200);
        $result = $this->service->process($file, 'stores', '42');
        $uuid   = $result['uuid'];

        Storage::disk('public')->assertExists("images/stores/42/{$uuid}/large.webp");
    }

    public function test_process_builds_path_without_store_id(): void
    {
        $file   = UploadedFile::fake()->image('cat.jpg', 200, 200);
        $result = $this->service->process($file, 'categories');
        $uuid   = $result['uuid'];

        Storage::disk('public')->assertExists("images/categories/{$uuid}/large.webp");
    }

    public function test_delete_removes_image_directory(): void
    {
        $file   = UploadedFile::fake()->image('del.jpg', 100, 100);
        $result = $this->service->process($file, 'products', '5');
        $uuid   = $result['uuid'];

        Storage::disk('public')->assertExists("images/products/5/{$uuid}/large.webp");

        $this->service->delete($uuid, 'products', '5');

        Storage::disk('public')->assertMissing("images/products/5/{$uuid}/large.webp");
    }

    public function test_process_rejects_unsupported_mime_type(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $file = UploadedFile::fake()->create('file.pdf', 100, 'application/pdf');
        $this->service->process($file, 'misc');
    }

    public function test_urls_contain_storage_prefix(): void
    {
        $file   = UploadedFile::fake()->image('img.jpg', 200, 150);
        $result = $this->service->process($file, 'misc');

        $this->assertStringContainsString('/storage/', $result['original']);
        $this->assertStringContainsString('/storage/', $result['thumbnail']);
    }

    public function test_prepare_stores_source_and_returns_deterministic_urls(): void
    {
        $file   = UploadedFile::fake()->image('p.jpg', 500, 500);
        $result = $this->service->prepare($file, 'products', '7');

        Storage::disk('public')->assertExists($result['source_path']);
        $this->assertSame("images/products/7/{$result['uuid']}/source", $result['source_path']);
        $this->assertStringContainsString("images/products/7/{$result['uuid']}/large.webp", $result['large']);
    }

    public function test_process_image_variants_job_generates_files_and_removes_source(): void
    {
        $folder = 'images/products/9/abc/';
        Storage::disk('public')->putFileAs($folder, UploadedFile::fake()->image('s.jpg', 900, 700), 'source');

        (new ProcessImageVariants($folder . 'source', 'products', '9', 'abc'))->handle($this->service);

        Storage::disk('public')->assertExists($folder . 'thumbnail.webp');
        Storage::disk('public')->assertExists($folder . 'medium.webp');
        Storage::disk('public')->assertExists($folder . 'large.webp');
        Storage::disk('public')->assertMissing($folder . 'source');
    }
}
