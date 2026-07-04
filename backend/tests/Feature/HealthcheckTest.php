<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthcheckTest extends TestCase
{
    public function test_the_healthcheck_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response
            ->assertOk()
            ->assertExactJson([
                'status' => 'ok',
            ]);
    }
}
