<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserSettingsEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_update_name(): void
    {
        $response = $this->patchJson('/api/user/name', [
            'name' => 'Updated Rider',
        ]);

        $response->assertUnauthorized();
    }

    public function test_user_can_update_their_name(): void
    {
        $user = User::factory()->create([
            'name' => 'Original Rider',
            'email' => 'rider@example.com',
            'is_admin' => true,
        ]);

        $response = $this->actingAs($user)->patchJson('/api/user/name', [
            'name' => 'Updated Rider',
        ]);

        $response->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('name', 'Updated Rider')
            ->assertJsonPath('email', 'rider@example.com')
            ->assertJsonPath('is_admin', true)
            ->assertJsonMissingPath('password');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Rider',
        ]);
    }

    public function test_name_update_rejects_invalid_data(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patchJson('/api/user/name', [
            'name' => '',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_guest_cannot_update_password(): void
    {
        $response = $this->patchJson('/api/user/password', [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertUnauthorized();
    }

    public function test_user_can_update_their_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        $response = $this->actingAs($user)->patchJson('/api/user/password', [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertNoContent();
        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }

    public function test_password_update_requires_confirmation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patchJson('/api/user/password', [
            'password' => 'new-password',
            'password_confirmation' => 'different-password',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }
}
