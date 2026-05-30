<?php

namespace Tests\Unit;

use App\Http\Middleware\SetLocale;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\App;
use Tests\TestCase;

class SetLocaleTest extends TestCase
{
    private function handleWith(?string $acceptLanguage): string
    {
        $request = Request::create('/', 'GET');
        if ($acceptLanguage !== null) {
            $request->headers->set('Accept-Language', $acceptLanguage);
        }

        (new SetLocale())->handle($request, fn () => new Response());

        return App::getLocale();
    }

    public function test_accepts_russian(): void
    {
        $this->assertEquals('ru', $this->handleWith('ru'));
    }

    public function test_accepts_armenian_and_english(): void
    {
        $this->assertEquals('hy', $this->handleWith('hy'));
        $this->assertEquals('en', $this->handleWith('en'));
    }

    public function test_unsupported_locale_falls_back_to_default(): void
    {
        $this->assertEquals(config('app.locale'), $this->handleWith('fr'));
    }
}
