<?php

namespace Tests\Feature;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;
use Illuminate\Session\Store;
use Tests\TestCase;

class SessionCsrfTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->setAppEnv('local');
    }

    protected function tearDown(): void
    {
        $this->setAppEnv('testing');

        parent::tearDown();
    }

    public function test_the_test_session_endpoint_requires_a_valid_csrf_token(): void
    {
        $this->withMiddleware(ValidateCsrfToken::class);

        $session = $this->startTestSession();

        $response = $this
            ->withCookie(config('session.cookie'), $session->getId())
            ->postJson('/api/test-session');

        $response->assertStatus(419);
    }

    public function test_the_test_session_endpoint_reuses_the_same_session_across_posts(): void
    {
        $this->withMiddleware(ValidateCsrfToken::class);

        $session = $this->startTestSession();
        $cookies = [
            config('session.cookie') => $session->getId(),
        ];
        $headers = [
            'X-CSRF-TOKEN' => $session->token(),
        ];

        $firstResponse = $this
            ->withCookies($cookies)
            ->postJson('/api/test-session', [], $headers);

        $firstResponse
            ->assertOk()
            ->assertJson([
                'status' => 'ok',
                'count' => 1,
            ]);

        $secondResponse = $this
            ->withCookies($cookies)
            ->postJson('/api/test-session', [], $headers);

        $secondResponse
            ->assertOk()
            ->assertJson([
                'status' => 'ok',
                'count' => 2,
            ]);
    }

    private function startTestSession(): Store
    {
        /** @var Store $session */
        $session = app('session')->driver();
        $session->start();
        $session->save();

        return $session;
    }

    private function setAppEnv(string $environment): void
    {
        putenv("APP_ENV={$environment}");
        $_ENV['APP_ENV'] = $environment;
        $_SERVER['APP_ENV'] = $environment;

        Route::flushMiddlewareGroups();
        Route::getRoutes()->refreshNameLookups();
        Route::getRoutes()->refreshActionLookups();

        $this->refreshApplication();
    }
}
