<?php

namespace Tests\Feature\Admin;

use App\Enums\PostStatus;
use App\Models\Post;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPostTest extends TestCase
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

    public function test_admin_can_create_post_with_english_only(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/admin/posts', [
                'title'   => ['en' => 'How to Sell Online in Armenia'],
                'content' => ['en' => '<p>Full guide content.</p>'],
            ])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'how-to-sell-online-in-armenia');

        $this->assertDatabaseHas('posts', ['slug' => 'how-to-sell-online-in-armenia']);
        $this->assertSame(PostStatus::Draft, Post::first()->status);
    }

    public function test_slug_collisions_get_numeric_suffix(): void
    {
        Post::factory()->create(['slug' => 'my-post']);

        $this->actingAsAdmin()
            ->postJson('/api/v1/admin/posts', [
                'title'   => ['en' => 'My Post'],
                'content' => ['en' => '<p>Body</p>'],
            ])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'my-post-2');
    }

    public function test_create_accepts_all_three_languages_and_explicit_slug(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/admin/posts', [
                'slug'    => 'trilingual-post',
                'title'   => ['en' => 'Title EN', 'hy' => 'Վերնագիր', 'ru' => 'Заголовок'],
                'excerpt' => ['en' => 'Short EN', 'ru' => 'Кратко'],
                'content' => ['en' => '<p>EN</p>', 'hy' => '<p>HY</p>', 'ru' => '<p>RU</p>'],
                'status'  => 'published',
            ])
            ->assertCreated()
            ->assertJsonPath('data.title.ru', 'Заголовок');

        $post = Post::where('slug', 'trilingual-post')->firstOrFail();
        $this->assertSame(PostStatus::Published, $post->status);
        $this->assertNotNull($post->published_at);
    }

    public function test_create_requires_english_title_and_content(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/admin/posts', [
                'title'   => ['hy' => 'Միայն հայերեն'],
                'content' => ['hy' => '<p>հայերեն</p>'],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title.en', 'content.en']);
    }

    public function test_invalid_slug_format_rejected(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/admin/posts', [
                'slug'    => 'Bad Slug!',
                'title'   => ['en' => 'X'],
                'content' => ['en' => 'Y'],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_admin_can_update_and_publish_post(): void
    {
        $post = Post::factory()->create();

        $this->actingAsAdmin()
            ->putJson("/api/v1/admin/posts/{$post->slug}", [
                'title'  => ['en' => 'Updated Title', 'ru' => 'Обновлено'],
                'status' => 'published',
            ])
            ->assertOk()
            ->assertJsonPath('data.title.en', 'Updated Title');

        $post->refresh();
        $this->assertSame(PostStatus::Published, $post->status);
        $this->assertNotNull($post->published_at);
    }

    public function test_admin_can_list_posts_with_status_filter(): void
    {
        Post::factory()->count(2)->create();
        Post::factory()->published()->create();

        $this->actingAsAdmin()
            ->getJson('/api/v1/admin/posts?status=published')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_admin_can_delete_post(): void
    {
        $post = Post::factory()->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/v1/admin/posts/{$post->slug}")
            ->assertOk();

        $this->assertSoftDeleted('posts', ['id' => $post->id]);
    }

    public function test_non_admin_cannot_manage_posts(): void
    {
        $seller = User::factory()->seller()->create();
        $seller->assignRole('seller');

        $this->actingAs($seller, 'sanctum')
            ->postJson('/api/v1/admin/posts', [
                'title'   => ['en' => 'Nope'],
                'content' => ['en' => 'Nope'],
            ])
            ->assertForbidden();
    }

    public function test_guest_cannot_manage_posts(): void
    {
        $this->postJson('/api/v1/admin/posts', [])->assertUnauthorized();
    }
}
