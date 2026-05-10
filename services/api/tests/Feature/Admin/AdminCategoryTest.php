<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCategoryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->admin = User::factory()->admin()->create();
        $this->admin->assignRole('super-admin');
    }

    private function actingAsAdmin(): static
    {
        return $this->actingAs($this->admin, 'sanctum');
    }

    public function test_admin_can_list_categories_as_tree(): void
    {
        $parent = Category::factory()->create();
        Category::factory()->create(['parent_id' => $parent->id]);

        $this->actingAsAdmin()
            ->getJson('/api/v1/admin/categories')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [['id', 'name', 'slug', 'children']],
            ]);
    }

    public function test_admin_can_create_category(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/admin/categories', [
                'name'       => ['hy' => 'Տեխնոլոգիա', 'en' => 'Technology'],
                'sort_order' => 0,
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.name.en', 'Technology');

        $this->assertDatabaseHas('categories', ['slug' => 'technology']);
    }

    public function test_create_category_auto_generates_slug(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/admin/categories', [
                'name' => ['hy' => 'Գեղեցկություն', 'en' => 'Beauty Products'],
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('categories', ['slug' => 'beauty-products']);
    }

    public function test_create_category_with_custom_slug(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/admin/categories', [
                'name' => ['hy' => 'Տուն', 'en' => 'Home'],
                'slug' => 'custom-home',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.slug', 'custom-home');
    }

    public function test_create_category_requires_name(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/admin/categories', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_category_requires_unique_slug(): void
    {
        Category::factory()->create(['slug' => 'existing-slug']);

        $this->actingAsAdmin()
            ->postJson('/api/v1/admin/categories', [
                'name' => ['hy' => 'Նոր', 'en' => 'New'],
                'slug' => 'existing-slug',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_admin_can_update_category(): void
    {
        $category = Category::factory()->create();

        $this->actingAsAdmin()
            ->patchJson("/api/v1/admin/categories/{$category->id}", [
                'name' => ['hy' => 'Թարմացված', 'en' => 'Updated Category'],
            ])
            ->assertOk()
            ->assertJsonPath('data.name.en', 'Updated Category');
    }

    public function test_admin_can_delete_category_without_products(): void
    {
        $category = Category::factory()->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/v1/admin/categories/{$category->id}")
            ->assertOk();

        $this->assertSoftDeleted('categories', ['id' => $category->id]);
    }

    public function test_admin_cannot_delete_category_with_active_products(): void
    {
        $category = Category::factory()->create();

        \App\Models\Store::factory()->create();
        $store = \App\Models\Store::first();

        \App\Models\Product::create([
            'store_id'    => $store->id,
            'category_id' => $category->id,
            'name'        => ['hy' => 'Ապրանք', 'en' => 'Product'],
            'slug'        => 'product-slug',
            'price'       => 1000,
            'status'      => 'active',
        ]);

        $this->actingAsAdmin()
            ->deleteJson("/api/v1/admin/categories/{$category->id}")
            ->assertStatus(422);
    }

    public function test_admin_can_reorder_category_children(): void
    {
        $parent = Category::factory()->create();
        $child1 = Category::factory()->create(['parent_id' => $parent->id, 'sort_order' => 0]);
        $child2 = Category::factory()->create(['parent_id' => $parent->id, 'sort_order' => 1]);

        $this->actingAsAdmin()
            ->postJson("/api/v1/admin/categories/{$parent->id}/reorder", [
                'order' => [$child2->id, $child1->id],
            ])
            ->assertOk();

        $this->assertDatabaseHas('categories', ['id' => $child2->id, 'sort_order' => 0]);
        $this->assertDatabaseHas('categories', ['id' => $child1->id, 'sort_order' => 1]);
    }

    public function test_reorder_requires_valid_category_ids(): void
    {
        $parent = Category::factory()->create();

        $this->actingAsAdmin()
            ->postJson("/api/v1/admin/categories/{$parent->id}/reorder", [
                'order' => [99999],
            ])
            ->assertStatus(422);
    }

    public function test_unauthenticated_cannot_access_categories(): void
    {
        $this->getJson('/api/v1/admin/categories')
            ->assertStatus(401);
    }
}
