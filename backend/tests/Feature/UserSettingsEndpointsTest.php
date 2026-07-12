<?php

namespace Tests\Feature;

use App\Http\Requests\DeleteUserAccountRequest;
use App\Models\Location;
use App\Models\Ride;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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

    public function test_guest_cannot_delete_account(): void
    {
        $response = $this->deleteJson('/api/user', [
            'confirmation_phrase' => DeleteUserAccountRequest::CONFIRMATION_PHRASE,
        ]);

        $response->assertUnauthorized();
    }

    public function test_account_deletion_requires_exact_confirmation_phrase(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->deleteJson('/api/user', [
            'confirmation_phrase' => 'Delete My Account',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['confirmation_phrase']);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
        ]);
    }

    public function test_user_can_delete_only_their_own_account_locations_and_rides(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $location = Location::factory()->create([
            'user_id' => $user->id,
        ]);
        $otherLocation = Location::factory()->create([
            'user_id' => $otherUser->id,
        ]);
        $ride = Ride::factory()->create([
            'user_id' => $user->id,
            'location_id' => $location->id,
        ]);
        $otherRide = Ride::factory()->create([
            'user_id' => $otherUser->id,
            'location_id' => $otherLocation->id,
        ]);

        Storage::put("ride-fit/{$ride->id}/ride.fit", 'fit contents');
        Storage::disk('public')->put("rides/{$ride->id}/image.jpg", 'image contents');
        Storage::put("ride-fit/{$otherRide->id}/ride.fit", 'fit contents');
        Storage::disk('public')->put("rides/{$otherRide->id}/image.jpg", 'image contents');

        $response = $this->actingAs($user)->deleteJson('/api/user', [
            'confirmation_phrase' => DeleteUserAccountRequest::CONFIRMATION_PHRASE,
        ]);

        $response->assertNoContent();
        $this->assertDatabaseMissing('users', [
            'id' => $user->id,
        ]);
        $this->assertDatabaseMissing('locations', [
            'id' => $location->id,
        ]);
        $this->assertDatabaseMissing('rides', [
            'id' => $ride->id,
        ]);
        Storage::assertMissing("ride-fit/{$ride->id}/ride.fit");
        Storage::disk('public')->assertMissing("rides/{$ride->id}/image.jpg");

        $this->assertDatabaseHas('users', [
            'id' => $otherUser->id,
        ]);
        $this->assertDatabaseHas('locations', [
            'id' => $otherLocation->id,
        ]);
        $this->assertDatabaseHas('rides', [
            'id' => $otherRide->id,
        ]);
        Storage::assertExists("ride-fit/{$otherRide->id}/ride.fit");
        Storage::disk('public')->assertExists("rides/{$otherRide->id}/image.jpg");
    }
}
