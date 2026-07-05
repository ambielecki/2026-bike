<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\Ride;
use App\Models\RideImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RideEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_create_ride(): void
    {
        $response = $this->postJson('/api/rides', []);

        $response->assertUnauthorized();
    }

    public function test_guest_cannot_list_rides(): void
    {
        $response = $this->getJson('/api/rides');

        $response->assertUnauthorized();
    }

    public function test_guest_cannot_view_ride_details(): void
    {
        $ride = Ride::factory()->create();

        $response = $this->getJson("/api/rides/{$ride->id}");

        $response->assertUnauthorized();
    }

    public function test_user_can_view_their_ride_details(): void
    {
        $user = User::factory()->create();
        $location = Location::factory()->create([
            'name' => 'North Park',
            'user_id' => $user->id,
            'latitude' => 40.123456,
            'longitude' => -79.123456,
        ]);
        $ride = Ride::factory()->create([
            'name' => 'Trail Loop',
            'description' => 'Good morning loop.',
            'user_id' => $user->id,
            'location_id' => $location->id,
            'distance' => 12.34,
            'total_time' => 3723,
            'moving_time' => 3600,
            'average_speed' => 11.1,
            'max_speed' => 22.2,
            'route_data' => [
                ['latitude' => 40.1, 'longitude' => -79.1],
                ['latitude' => 40.2, 'longitude' => -79.2],
            ],
        ]);

        $response = $this->actingAs($user)->getJson("/api/rides/{$ride->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $ride->id)
            ->assertJsonPath('data.name', 'Trail Loop')
            ->assertJsonPath('data.description', 'Good morning loop.')
            ->assertJsonPath('data.distance', '12.34')
            ->assertJsonPath('data.total_time', '3723.00')
            ->assertJsonPath('data.moving_time', '3600.00')
            ->assertJsonPath('data.average_speed', '11.10')
            ->assertJsonPath('data.max_speed', '22.20')
            ->assertJsonPath('data.location.name', 'North Park')
            ->assertJsonPath('data.route_data.0.latitude', 40.1)
            ->assertJsonPath('data.route_data.1.longitude', -79.2);
    }

    public function test_user_cannot_view_another_users_ride_details(): void
    {
        $user = User::factory()->create();
        $otherRide = Ride::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/rides/{$otherRide->id}");

        $response->assertNotFound();
    }

    public function test_user_can_list_only_their_rides(): void
    {
        $user = User::factory()->create();
        $location = Location::factory()->create([
            'user_id' => $user->id,
        ]);
        $ride = Ride::factory()->create([
            'name' => 'River Ride',
            'user_id' => $user->id,
            'location_id' => $location->id,
            'datetime' => now()->subDay(),
            'distance' => 12.34,
            'total_time' => 3723,
        ]);
        Ride::factory()->create([
            'name' => 'Other Ride',
        ]);

        $response = $this->actingAs($user)->getJson('/api/rides');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $ride->id)
            ->assertJsonPath('data.0.name', 'River Ride')
            ->assertJsonPath('data.0.distance', '12.34')
            ->assertJsonPath('data.0.total_time', '3723.00')
            ->assertJsonPath('data.0.location.name', $location->name)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonMissing(['name' => 'Other Ride']);
    }

    public function test_user_can_filter_rides_by_owned_location_and_date_range(): void
    {
        $user = User::factory()->create();
        $location = Location::factory()->create([
            'user_id' => $user->id,
        ]);
        $otherLocation = Location::factory()->create([
            'user_id' => $user->id,
        ]);
        $matchingRide = Ride::factory()->create([
            'name' => 'Matching Ride',
            'user_id' => $user->id,
            'location_id' => $location->id,
            'datetime' => now()->subDays(3),
        ]);
        Ride::factory()->create([
            'name' => 'Old Ride',
            'user_id' => $user->id,
            'location_id' => $location->id,
            'datetime' => now()->subDays(10),
        ]);
        Ride::factory()->create([
            'name' => 'Other Location Ride',
            'user_id' => $user->id,
            'location_id' => $otherLocation->id,
            'datetime' => now()->subDays(2),
        ]);

        $response = $this->actingAs($user)->getJson("/api/rides?location_id={$location->id}&date_range=last_week");

        $response->assertOk()
            ->assertJsonPath('data.0.id', $matchingRide->id)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonMissing(['name' => 'Old Ride'])
            ->assertJsonMissing(['name' => 'Other Location Ride']);
    }

    public function test_ride_list_rejects_invalid_filters(): void
    {
        $user = User::factory()->create();
        $otherLocation = Location::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/rides?location_id={$otherLocation->id}&date_range=forever&per_page=100");

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['location_id', 'date_range', 'per_page']);
    }

    public function test_ride_list_uses_small_thumbnail_when_sizes_exist_and_original_fallback(): void
    {
        $user = User::factory()->create();
        $location = Location::factory()->create([
            'user_id' => $user->id,
        ]);
        $rideWithSizes = Ride::factory()->create([
            'user_id' => $user->id,
            'location_id' => $location->id,
            'datetime' => now(),
        ]);
        RideImage::factory()->create([
            'ride_id' => $rideWithSizes->id,
            'user_id' => $user->id,
            'name' => 'with-sizes.jpg',
            'has_sizes' => true,
        ]);
        $rideWithoutSizes = Ride::factory()->create([
            'user_id' => $user->id,
            'location_id' => $location->id,
            'datetime' => now()->subDay(),
        ]);
        RideImage::factory()->create([
            'ride_id' => $rideWithoutSizes->id,
            'user_id' => $user->id,
            'name' => 'original.jpg',
            'has_sizes' => false,
        ]);

        $response = $this->actingAs($user)->getJson('/api/rides?per_page=10');

        $storageUrl = Config::get('filesystems.disks.public.url');

        $response->assertOk()
            ->assertJsonPath('data.0.thumbnail_url', "{$storageUrl}/rides/{$rideWithSizes->id}/images/small/with-sizes.jpg")
            ->assertJsonPath('data.1.thumbnail_url', "{$storageUrl}/rides/{$rideWithoutSizes->id}/images/original/original.jpg");
    }

    public function test_user_can_create_ride_with_fit_file_and_image(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        Artisan::shouldReceive('call')
            ->once()
            ->with('ride:process-fit', \Mockery::on(fn (array $arguments): bool => isset($arguments['ride'], $arguments['fitPath'])))
            ->andReturn(0);
        Artisan::shouldReceive('call')
            ->once()
            ->with('ride:create-image-sizes', \Mockery::on(fn (array $arguments): bool => isset($arguments['image'])))
            ->andReturn(0);

        $user = User::factory()->create();
        $location = Location::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->postJson('/api/rides', [
            'name' => 'Morning Ride',
            'description' => 'Easy spin',
            'location_id' => $location->id,
            'fit_file' => UploadedFile::fake()->create('morning.fit', 10, 'application/octet-stream'),
            'image' => UploadedFile::fake()->image('photo.jpg'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Morning Ride')
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.location_id', $location->id)
            ->assertJsonCount(1, 'data.images');

        $this->assertDatabaseHas('rides', [
            'name' => 'Morning Ride',
            'description' => 'Easy spin',
            'user_id' => $user->id,
            'location_id' => $location->id,
        ]);
        $this->assertDatabaseCount('images', 1);

        $fitFiles = Storage::disk('local')->allFiles('ride-fit');
        $imageFiles = Storage::disk('public')->allFiles("rides/{$response->json('data.id')}/images/original");

        $this->assertCount(1, $fitFiles);
        $this->assertCount(1, $imageFiles);
    }

    public function test_user_cannot_create_ride_for_another_users_location(): void
    {
        Artisan::shouldReceive('call')->never();

        $user = User::factory()->create();
        $otherLocation = Location::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/rides', [
            'name' => 'Morning Ride',
            'location_id' => $otherLocation->id,
            'fit_file' => UploadedFile::fake()->create('morning.fit', 10, 'application/octet-stream'),
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['location_id']);
    }

    public function test_ride_creation_validates_required_fields(): void
    {
        Artisan::shouldReceive('call')->never();

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/rides', [
            'name' => '',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'location_id', 'fit_file']);
    }
}
