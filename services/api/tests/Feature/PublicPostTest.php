<?php

namespace Tests\Feature;

use App\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicPostTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_only_published_posts_newest_first(): void
    {
        Post::factory()->create(['slug' => 'draft-post']);
        Post::factory()->published()->create([
            'slug'         => 'older-post',
            'published_at' => now()->subDays(3),
        ]);
        Post::factory()->published()->create([
            'slug'         => 'newer-post',
            'published_at' => now()->subDay(),
        ]);
        Post::factory()->create([
            'slug'         => 'scheduled-post',
            'status'       => 'published',
            'published_at' => now()->addWeek(),
        ]);

        $this->getJson('/api/v1/posts')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 2)
            ->assertJsonPath('data.data.0.slug', 'newer-post')
            ->assertJsonPath('data.data.1.slug', 'older-post');
    }

    public function test_index_paginates(): void
    {
        Post::factory()->published()->count(5)->create();

        $this->getJson('/api/v1/posts?per_page=2&page=2')
            ->assertOk()
            ->assertJsonPath('data.meta.last_page', 3)
            ->assertJsonCount(2, 'data.data');
    }

    public function test_show_returns_full_trilingual_payload(): void
    {
        Post::factory()->published()->create([
            'slug'    => 'full-post',
            'title'   => ['en' => 'EN Title', 'hy' => 'ՀՅ', 'ru' => 'РУ'],
            'content' => ['en' => '<p>EN</p>', 'hy' => '<p>ՀՅ</p>', 'ru' => '<p>РУ</p>'],
        ]);

        $this->getJson('/api/v1/posts/full-post')
            ->assertOk()
            ->assertJsonPath('data.title.ru', 'РУ')
            ->assertJsonPath('data.content.hy', '<p>ՀՅ</p>')
            ->assertJsonStructure(['data' => ['slug', 'title', 'content', 'author_name', 'published_at', 'updated_at']]);
    }

    public function test_show_returns_404_for_draft_or_missing(): void
    {
        Post::factory()->create(['slug' => 'hidden-draft']);

        $this->getJson('/api/v1/posts/hidden-draft')->assertNotFound();
        $this->getJson('/api/v1/posts/does-not-exist')->assertNotFound();
    }

    public function test_detail_cache_is_flushed_when_post_updated(): void
    {
        $post = Post::factory()->published()->create(['slug' => 'cached-post', 'title' => ['en' => 'Before']]);

        $this->getJson('/api/v1/posts/cached-post')->assertJsonPath('data.title.en', 'Before');

        $post->update(['title' => ['en' => 'After']]);

        $this->getJson('/api/v1/posts/cached-post')->assertJsonPath('data.title.en', 'After');
    }

    public function test_list_cache_is_flushed_when_post_created(): void
    {
        Post::factory()->published()->create();

        $this->getJson('/api/v1/posts')->assertJsonPath('data.meta.total', 1);

        Post::factory()->published()->create();

        $this->getJson('/api/v1/posts')->assertJsonPath('data.meta.total', 2);
    }

    public function test_deleted_post_disappears_from_public_api(): void
    {
        $post = Post::factory()->published()->create(['slug' => 'gone-soon']);

        $this->getJson('/api/v1/posts/gone-soon')->assertOk();

        $post->delete();

        $this->getJson('/api/v1/posts/gone-soon')->assertNotFound();
    }
}
