<?php

namespace Tests\Feature;

use Tests\TestCase;

class AuthenticationCookieConfigurationTest extends TestCase
{
    protected function tearDown(): void
    {
        $this->setEnvironmentValue('CORS_ALLOWED_ORIGINS', null);
        parent::tearDown();
    }

    public function test_cors_allowed_origins_supports_comma_separated_domains(): void
    {
        $this->setEnvironmentValue(
            'CORS_ALLOWED_ORIGINS',
            'https://showmyrides.com, https://www.showmyrides.com',
        );
        $this->refreshApplication();

        $this->assertSame([
            'https://showmyrides.com',
            'https://www.showmyrides.com',
        ], config('cors.allowed_origins'));
    }

    private function setEnvironmentValue(string $key, ?string $value): void
    {
        if ($value === null) {
            putenv($key);
            unset($_ENV[$key], $_SERVER[$key]);

            return;
        }

        putenv("{$key}={$value}");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}
