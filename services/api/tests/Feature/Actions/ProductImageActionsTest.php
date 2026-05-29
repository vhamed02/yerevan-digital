<?php

namespace Tests\Feature\Actions;

use App\Actions\DeleteProductImageAction;
use App\Actions\ReorderProductImagesAction;
use App\Actions\UploadProductImagesAction;
use App\Enums\ProductStatus;
use App\Enums\StoreStatus;
use App\Models\Product;
use App\Models\Store;
use App\Services\ImageService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Mockery;
use Tests\TestCase;

class ProductImageActionsTest extends TestCase
{
    use RefreshDatabase;

    private Store   $store;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->store   = Store::factory()->create(['status' => StoreStatus::Active]);
        $this->product = Product::factory()->create([
            'store_id' => $this->store->id,
            'status'   => ProductStatus::Active,
        ]);
    }

    private function makeImage(int $sortOrder, bool $primary = false): int
    {
        return $this->product->images()->create([
            'path_original'  => "o{$sortOrder}.webp",
            'path_thumbnail' => "t{$sortOrder}.webp",
            'path_medium'    => "m{$sortOrder}.webp",
            'path_large'     => "l{$sortOrder}.webp",
            'sort_order'     => $sortOrder,
            'is_primary'     => $primary,
        ])->id;
    }

    public function test_upload_marks_first_image_of_first_upload_as_primary(): void
    {
        $imageService = Mockery::mock(ImageService::class);
        $imageService->shouldReceive('process')->twice()->andReturn([
            'original'  => 'o.webp',
            'thumbnail' => 't.webp',
            'medium'    => 'm.webp',
            'large'     => 'l.webp',
        ]);

        $action = new UploadProductImagesAction($imageService);

        $images = $action->execute($this->product, [
            UploadedFile::fake()->create('a.webp'),
            UploadedFile::fake()->create('b.webp'),
        ], (string) $this->store->id);

        $this->assertCount(2, $images);
        $this->assertTrue($images[0]->is_primary);
        $this->assertFalse($images[1]->is_primary);
        $this->assertEquals([1, 2], [$images[0]->sort_order, $images[1]->sort_order]);
    }

    public function test_upload_to_product_with_existing_images_sets_no_new_primary(): void
    {
        $this->makeImage(1, primary: true);

        $imageService = Mockery::mock(ImageService::class);
        $imageService->shouldReceive('process')->once()->andReturn([
            'original' => 'o.webp', 'thumbnail' => 't.webp', 'medium' => 'm.webp', 'large' => 'l.webp',
        ]);

        $images = (new UploadProductImagesAction($imageService))
            ->execute($this->product, [UploadedFile::fake()->create('c.webp')], (string) $this->store->id);

        $this->assertFalse($images[0]->is_primary);
        $this->assertEquals(2, $images[0]->sort_order);
    }

    public function test_delete_promotes_next_image_to_primary(): void
    {
        $first  = $this->makeImage(0, primary: true);
        $second = $this->makeImage(1);

        (new DeleteProductImageAction())->execute($this->product, $first);

        $this->assertDatabaseMissing('product_images', ['id' => $first]);
        $this->assertTrue((bool) $this->product->images()->find($second)->is_primary);
    }

    public function test_delete_non_primary_leaves_primary_untouched(): void
    {
        $primary = $this->makeImage(0, primary: true);
        $other   = $this->makeImage(1);

        (new DeleteProductImageAction())->execute($this->product, $other);

        $this->assertTrue((bool) $this->product->images()->find($primary)->is_primary);
    }

    public function test_reorder_applies_new_order_and_sets_first_as_primary(): void
    {
        $a = $this->makeImage(0, primary: true);
        $b = $this->makeImage(1);
        $c = $this->makeImage(2);

        $result = (new ReorderProductImagesAction())->execute($this->product, [$c, $a, $b]);

        $this->assertEquals([$c, $a, $b], $result->pluck('id')->all());
        $this->assertTrue((bool) $this->product->images()->find($c)->is_primary);
        $this->assertFalse((bool) $this->product->images()->find($a)->is_primary);
        $this->assertEquals(0, $this->product->images()->find($c)->sort_order);
    }
}
