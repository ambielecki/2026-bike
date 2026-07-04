<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class TestErrorEndpointsTest extends TestCase
{
    protected function tearDown(): void
    {
        $this->setAppEnv('testing');

        parent::tearDown();
    }

    public function test_the_not_found_test_endpoint_returns_a_404_response(): void
    {
        $response = $this->getJson('/api/test-errors/not-found');

        $response
            ->assertStatus(404)
            ->assertJson([
                'message' => 'Test not found error.',
            ]);
    }

    public function test_the_server_error_test_endpoint_returns_a_500_response(): void
    {
        $response = $this->getJson('/api/test-errors/server-error');

        $response
            ->assertStatus(500)
            ->assertJson([
                'message' => 'Test server error.',
            ]);
    }

    public function test_the_validation_test_endpoint_returns_a_422_response(): void
    {
        $response = $this->getJson('/api/test-errors/validation');

        $response
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Test validation error.',
                'errors' => [
                    'test' => ['Test validation error.'],
                ],
            ]);
    }

    public function test_the_test_error_endpoints_are_not_registered_in_production(): void
    {
        $this->setAppEnv('Production');

        $this->assertFalse(Route::has('generated::api.test-errors.not-found'));
        $this->assertFalse(Route::has('generated::api.test-errors.server-error'));
        $this->assertFalse(Route::has('generated::api.test-errors.validation'));

        $response = $this->getJson('/api/test-errors/not-found');

        $response->assertStatus(404);
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
