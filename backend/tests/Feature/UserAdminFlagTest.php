<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAdminFlagTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_admin_flag_defaults_to_false(): void
    {
        $user = User::factory()->create();

        $this->assertFalse($user->is_admin);
        $this->assertIsBool($user->is_admin);
    }

    public function test_user_admin_flag_can_be_set_to_true(): void
    {
        $user = User::factory()->create([
            'is_admin' => true,
        ]);

        $this->assertTrue($user->is_admin);
        $this->assertIsBool($user->is_admin);
    }
}
