<?php

namespace Tests\Feature;

use App\Models\Image;
use App\Models\Ride;
use App\Services\FitRideDataExtractor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class RideCommandsTest extends TestCase
{
    use RefreshDatabase;

    public function test_process_fit_command_updates_ride_and_removes_fit_file(): void
    {
        Storage::fake('local');

        $ride = Ride::factory()->create([
            'datetime' => null,
            'route_data' => null,
            'distance' => null,
            'total_time' => null,
            'moving_time' => null,
            'average_speed' => null,
            'max_speed' => null,
        ]);
        $fitPath = "ride-fit/{$ride->id}/activity.fit";
        Storage::put($fitPath, 'fake fit bytes');

        $extractor = Mockery::mock(FitRideDataExtractor::class);
        $extractor->shouldReceive('extract')
            ->once()
            ->andReturn([
                'datetime' => '2026-07-04 12:00:00',
                'route_data' => [
                    [
                        'latitude' => 40.1,
                        'longitude' => -79.1,
                    ],
                ],
                'distance' => 1200.5,
                'total_time' => 300.25,
                'moving_time' => 275.5,
                'average_speed' => 4.0,
                'max_speed' => 8.0,
            ]);
        $this->app->instance(FitRideDataExtractor::class, $extractor);

        $this->artisan('ride:process-fit', [
            'ride' => $ride->id,
            'fitPath' => $fitPath,
        ])->assertSuccessful();

        $ride->refresh();

        $this->assertSame('1200.50', $ride->distance);
        $this->assertSame('300.25', $ride->total_time);
        $this->assertSame('275.50', $ride->moving_time);
        $this->assertSame('4.00', $ride->average_speed);
        $this->assertSame('8.00', $ride->max_speed);
        $this->assertCount(1, $ride->route_data);
        Storage::assertMissing($fitPath);
    }

    public function test_create_image_sizes_command_writes_size_files(): void
    {
        Storage::fake('public');

        $image = Image::factory()->create([
            'name' => 'ride.jpg',
            'has_sizes' => false,
        ]);

        Storage::disk('public')->put(
            'homepage/images/original/ride.jpg',
            $this->jpegBytes(),
        );

        $this->artisan('image:create-sizes', [
            'image' => $image->id,
        ])->assertSuccessful();

        Storage::disk('public')->assertExists('homepage/images/small/ride.jpg');
        Storage::disk('public')->assertExists('homepage/images/medium/ride.jpg');
        Storage::disk('public')->assertExists('homepage/images/large/ride.jpg');
        $this->assertTrue($image->refresh()->has_sizes);
    }

    private function jpegBytes(): string
    {
        $image = imagecreatetruecolor(10, 10);
        ob_start();
        imagejpeg($image);
        $bytes = (string) ob_get_clean();
        imagedestroy($image);

        return $bytes;
    }
}
