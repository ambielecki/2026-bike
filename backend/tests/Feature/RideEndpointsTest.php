<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
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
