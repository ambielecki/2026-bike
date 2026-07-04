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
}
