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
        RideImage::factory()->create([
            'ride_id' => $ride->id,
            'user_id' => $user->id,
            'name' => 'first.jpg',
            'has_sizes' => true,
        ]);

        $response = $this->actingAs($user)->getJson("/api/rides/{$ride->id}");
        $storageUrl = Config::get('filesystems.disks.public.url');

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
            ->assertJsonPath('data.route_data.1.longitude', -79.2)
            ->assertJsonPath('data.image_url', "{$storageUrl}/rides/{$ride->id}/images/medium/first.jpg");
    }

    public function test_ride_details_image_url_uses_original_when_sizes_are_missing(): void
    {
        $user = User::factory()->create();
        $ride = Ride::factory()->create([
            'user_id' => $user->id,
        ]);
        RideImage::factory()->create([
            'ride_id' => $ride->id,
            'user_id' => $user->id,
            'name' => 'original.jpg',
            'has_sizes' => false,
        ]);

        $response = $this->actingAs($user)->getJson("/api/rides/{$ride->id}");
        $storageUrl = Config::get('filesystems.disks.public.url');

        $response->assertOk()
            ->assertJsonPath('data.image_url', "{$storageUrl}/rides/{$ride->id}/images/original/original.jpg");
    }

    public function test_ride_details_image_url_is_null_without_images(): void
    {
        $user = User::factory()->create();
        $ride = Ride::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson("/api/rides/{$ride->id}");

        $response->assertOk()
            ->assertJsonPath('data.image_url', null);
    }

    public function test_user_cannot_view_another_users_ride_details(): void
    {
        $user = User::factory()->create();
        $otherRide = Ride::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/rides/{$otherRide->id}");

        $response->assertNotFound();
    }

    public function test_guest_cannot_update_ride(): void
    {
        $ride = Ride::factory()->create();

        $response = $this->patchJson("/api/rides/{$ride->id}", [
            'name' => 'Updated Ride',
        ]);

        $response->assertUnauthorized();
    }

    public function test_user_can_update_their_ride_name_and_description(): void
    {
        $user = User::factory()->create();
        $ride = Ride::factory()->create([
            'name' => 'Original Ride',
            'description' => 'Original description.',
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->patchJson("/api/rides/{$ride->id}", [
            'name' => 'Updated Ride',
            'description' => 'Updated description.',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $ride->id)
            ->assertJsonPath('data.name', 'Updated Ride')
            ->assertJsonPath('data.description', 'Updated description.');

        $this->assertDatabaseHas('rides', [
            'id' => $ride->id,
            'name' => 'Updated Ride',
            'description' => 'Updated description.',
        ]);
    }

    public function test_user_can_clear_ride_description(): void
    {
        $user = User::factory()->create();
        $ride = Ride::factory()->create([
            'description' => 'Original description.',
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->patchJson("/api/rides/{$ride->id}", [
            'name' => 'Updated Ride',
            'description' => null,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.description', null);

        $this->assertDatabaseHas('rides', [
            'id' => $ride->id,
            'description' => null,
        ]);
    }

    public function test_user_cannot_update_another_users_ride(): void
    {
        $user = User::factory()->create();
        $otherRide = Ride::factory()->create([
            'name' => 'Other Ride',
        ]);

        $response = $this->actingAs($user)->patchJson("/api/rides/{$otherRide->id}", [
            'name' => 'Updated Ride',
        ]);

        $response->assertNotFound();

        $this->assertDatabaseHas('rides', [
            'id' => $otherRide->id,
            'name' => 'Other Ride',
        ]);
    }

    public function test_ride_update_rejects_invalid_data(): void
    {
        $user = User::factory()->create();
        $ride = Ride::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->patchJson("/api/rides/{$ride->id}", [
            'name' => '',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_guest_cannot_delete_ride(): void
    {
        $ride = Ride::factory()->create();

        $response = $this->deleteJson("/api/rides/{$ride->id}");

        $response->assertUnauthorized();
    }

    public function test_user_can_delete_their_ride(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create();
        $ride = Ride::factory()->create([
            'user_id' => $user->id,
        ]);
        RideImage::factory()->create([
            'ride_id' => $ride->id,
            'user_id' => $user->id,
            'name' => 'photo.jpg',
        ]);

        Storage::put("ride-fit/{$ride->id}/ride.fit", 'fit contents');
        Storage::disk('public')->put("rides/{$ride->id}/images/original/photo.jpg", 'image contents');

        $response = $this->actingAs($user)->deleteJson("/api/rides/{$ride->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('rides', ['id' => $ride->id]);
        $this->assertDatabaseMissing('images', ['ride_id' => $ride->id]);
        Storage::assertMissing("ride-fit/{$ride->id}/ride.fit");
        Storage::disk('public')->assertMissing("rides/{$ride->id}/images/original/photo.jpg");
    }

    public function test_user_cannot_delete_another_users_ride(): void
    {
        $user = User::factory()->create();
        $otherRide = Ride::factory()->create();

        $response = $this->actingAs($user)->deleteJson("/api/rides/{$otherRide->id}");

        $response->assertNotFound();
        $this->assertDatabaseHas('rides', ['id' => $otherRide->id]);
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

    public function test_user_can_filter_rides_by_watopia_location(): void
    {
        $user = User::factory()->create();
        $watopia = Location::factory()->watopia()->create();
        $ownedLocation = Location::factory()->create([
            'user_id' => $user->id,
        ]);
        $matchingRide = Ride::factory()->create([
            'name' => 'Watopia Ride',
            'user_id' => $user->id,
            'location_id' => $watopia->id,
            'datetime' => now(),
        ]);
        Ride::factory()->create([
            'name' => 'Outdoor Ride',
            'user_id' => $user->id,
            'location_id' => $ownedLocation->id,
            'datetime' => now()->subDay(),
        ]);

        $response = $this->actingAs($user)->getJson("/api/rides?location_id={$watopia->id}");

        $response->assertOk()
            ->assertJsonPath('data.0.id', $matchingRide->id)
            ->assertJsonPath('data.0.location.system_key', 'watopia')
            ->assertJsonPath('data.0.location.map_provider', 'watopia')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonMissing(['name' => 'Outdoor Ride']);
    }

    public function test_user_can_filter_rides_by_date_bounds_and_location(): void
    {
        $user = User::factory()->create();
        $location = Location::factory()->create([
            'user_id' => $user->id,
        ]);
        $otherLocation = Location::factory()->create([
            'user_id' => $user->id,
        ]);
        $matchingRide = Ride::factory()->create([
            'name' => 'Overlay Ride',
            'user_id' => $user->id,
            'location_id' => $location->id,
            'datetime' => '2026-07-04 10:30:00',
        ]);
        Ride::factory()->create([
            'name' => 'Too Early Ride',
            'user_id' => $user->id,
            'location_id' => $location->id,
            'datetime' => '2026-07-01 10:30:00',
        ]);
        Ride::factory()->create([
            'name' => 'Too Late Ride',
            'user_id' => $user->id,
            'location_id' => $location->id,
            'datetime' => '2026-07-08 10:30:00',
        ]);
        Ride::factory()->create([
            'name' => 'Wrong Location Ride',
            'user_id' => $user->id,
            'location_id' => $otherLocation->id,
            'datetime' => '2026-07-04 10:30:00',
        ]);
        Ride::factory()->create([
            'name' => 'Another User Ride',
            'datetime' => '2026-07-04 10:30:00',
        ]);

        $response = $this->actingAs($user)->getJson("/api/rides?location_id={$location->id}&start_date=2026-07-03&end_date=2026-07-05&per_page=50");

        $response->assertOk()
            ->assertJsonPath('data.0.id', $matchingRide->id)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonMissing(['name' => 'Too Early Ride'])
            ->assertJsonMissing(['name' => 'Too Late Ride'])
            ->assertJsonMissing(['name' => 'Wrong Location Ride'])
            ->assertJsonMissing(['name' => 'Another User Ride']);
    }

    public function test_ride_list_rejects_invalid_filters(): void
    {
        $user = User::factory()->create();
        $otherLocation = Location::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/rides?location_id={$otherLocation->id}&date_range=forever&per_page=100&start_date=not-a-date&end_date=2026-01-01");

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['location_id', 'date_range', 'per_page', 'start_date']);
    }

    public function test_ride_list_rejects_end_date_before_start_date(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/rides?start_date=2026-07-05&end_date=2026-07-04');

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['end_date']);
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

    public function test_user_can_create_ride_for_watopia_location(): void
    {
        Storage::fake('local');
        Artisan::shouldReceive('call')
            ->once()
            ->with('ride:process-fit', \Mockery::on(fn (array $arguments): bool => isset($arguments['ride'], $arguments['fitPath'])))
            ->andReturn(0);

        $user = User::factory()->create();
        $watopia = Location::factory()->watopia()->create();

        $response = $this->actingAs($user)->postJson('/api/rides', [
            'name' => 'Watopia Spin',
            'location_id' => $watopia->id,
            'fit_file' => UploadedFile::fake()->create('watopia.fit', 10, 'application/octet-stream'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Watopia Spin')
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.location_id', $watopia->id);

        $this->assertDatabaseHas('rides', [
            'name' => 'Watopia Spin',
            'user_id' => $user->id,
            'location_id' => $watopia->id,
        ]);
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
