<?php

namespace Database\Factories;

use App\Enums\PostStatus;
use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PostFactory extends Factory
{
    protected $model = Post::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(4);

        return [
            'slug'        => Str::slug($title),
            'title'       => ['hy' => $title, 'en' => $title],
            'excerpt'     => ['hy' => fake()->sentence(), 'en' => fake()->sentence()],
            'content'     => ['hy' => '<p>' . fake()->paragraph() . '</p>', 'en' => '<p>' . fake()->paragraph() . '</p>'],
            'author_name' => 'Vendorex',
            'status'      => PostStatus::Draft,
        ];
    }

    public function published(): static
    {
        return $this->state([
            'status'       => PostStatus::Published,
            'published_at' => now()->subDay(),
        ]);
    }
}
