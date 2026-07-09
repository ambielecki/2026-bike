<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocationEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_their_locations(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $location = Location::factory()->create([
            'name' => 'River Trail',
            'user_id' => $user->id,
        ]);
        Location::factory()->create([
            'name' => 'Hidden Trail',
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/locations');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $location->id)
            ->assertJsonMissing(['name' => 'Hidden Trail']);
    }

    public function test_user_can_list_locations_with_pagination(): void
    {
        $user = User::factory()->create();
        Location::factory()->create([
            'name' => 'Alpha Trail',
            'user_id' => $user->id,
        ]);
        $secondLocation = Location::factory()->create([
            'name' => 'Beta Trail',
            'user_id' => $user->id,
        ]);
        Location::factory()->create([
            'name' => 'Gamma Trail',
            'user_id' => $user->id,
        ]);
        Location::factory()->create([
            'name' => 'Other Trail',
        ]);

        $response = $this->actingAs($user)->getJson('/api/locations?page=2&per_page=1');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $secondLocation->id)
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonPath('meta.total', 3)
            ->assertJsonMissing(['name' => 'Other Trail']);
    }

    public function test_location_list_rejects_invalid_pagination(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/locations?page=0&per_page=100');

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['page', 'per_page']);
    }

    public function test_user_can_create_location(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/locations', [
            'name' => 'North Park',
            'latitude' => 40.123456,
            'longitude' => -79.123456,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'North Park')
            ->assertJsonPath('data.user_id', $user->id);

        $this->assertDatabaseHas('locations', [
            'name' => 'North Park',
            'user_id' => $user->id,
            'latitude' => 40.123456,
            'longitude' => -79.123456,
        ]);
    }

    public function test_location_creation_validates_input(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/locations', [
            'name' => '',
            'latitude' => 91,
            'longitude' => -181,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'latitude', 'longitude']);
    }

    public function test_guest_cannot_update_location(): void
    {
        $location = Location::factory()->create();

        $response = $this->patchJson("/api/locations/{$location->id}", [
            'name' => 'Updated Trail',
            'latitude' => 40.123456,
            'longitude' => -79.123456,
        ]);

        $response->assertUnauthorized();
    }

    public function test_user_can_update_their_location(): void
    {
        $user = User::factory()->create();
        $location = Location::factory()->create([
            'user_id' => $user->id,
            'name' => 'Original Trail',
        ]);

        $response = $this->actingAs($user)->patchJson("/api/locations/{$location->id}", [
            'name' => 'Updated Trail',
            'latitude' => 40.123456,
            'longitude' => -79.123456,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $location->id)
            ->assertJsonPath('data.name', 'Updated Trail')
            ->assertJsonPath('data.latitude', '40.123456')
            ->assertJsonPath('data.longitude', '-79.123456');

        $this->assertDatabaseHas('locations', [
            'id' => $location->id,
            'name' => 'Updated Trail',
            'latitude' => 40.123456,
            'longitude' => -79.123456,
        ]);
    }

    public function test_user_cannot_update_another_users_location(): void
    {
        $user = User::factory()->create();
        $otherLocation = Location::factory()->create([
            'name' => 'Other Trail',
        ]);

        $response = $this->actingAs($user)->patchJson("/api/locations/{$otherLocation->id}", [
            'name' => 'Updated Trail',
            'latitude' => 40.123456,
            'longitude' => -79.123456,
        ]);

        $response->assertNotFound();

        $this->assertDatabaseHas('locations', [
            'id' => $otherLocation->id,
            'name' => 'Other Trail',
        ]);
    }

    public function test_location_update_validates_input(): void
    {
        $user = User::factory()->create();
        $location = Location::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->patchJson("/api/locations/{$location->id}", [
            'name' => '',
            'latitude' => 91,
            'longitude' => -181,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'latitude', 'longitude']);
    }
}
