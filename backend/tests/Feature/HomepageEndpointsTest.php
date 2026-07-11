<?php

namespace Tests\Feature;

use App\Models\Image;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HomepageEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_homepage_endpoint_returns_default_content(): void
    {
        $response = $this->getJson('/api/homepage');

        $response->assertOk()
            ->assertJsonPath('data.site_name', 'BikeMap')
            ->assertJsonPath('data.headline', 'Track every mountain bike route worth riding twice.')
            ->assertJsonPath('data.highlights.0.title', 'Save routes that matter')
            ->assertJsonPath('data.carousel_images', []);
    }

    public function test_guest_cannot_view_admin_homepage(): void
    {
        $response = $this->getJson('/api/admin/homepage');

        $response->assertUnauthorized();
    }

    public function test_non_admin_cannot_view_admin_homepage(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
        ]);

        $response = $this->actingAs($user)->getJson('/api/admin/homepage');

        $response->assertForbidden();
    }

    public function test_admin_can_update_homepage_content_and_carousel_images(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
        ]);
        $firstImage = Image::factory()->create([
            'alt_text' => 'First trail image',
        ]);
        $secondImage = Image::factory()->create([
            'alt_text' => 'Second trail image',
        ]);

        $response = $this->actingAs($admin)->patchJson('/api/admin/homepage', [
            'site_name' => 'Trail Home',
            'headline' => 'Ride the best loops.',
            'intro' => 'Updated homepage intro.',
            'highlights' => [
                [
                    'title' => 'Plan',
                    'copy' => 'Pick the right route.',
                ],
                [
                    'title' => 'Remember',
                    'copy' => 'Keep the details.',
                ],
            ],
            'carousel_image_ids' => [$secondImage->id, $firstImage->id],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.site_name', 'Trail Home')
            ->assertJsonPath('data.highlights.1.sort_order', 1)
            ->assertJsonPath('data.carousel_images.0.id', $secondImage->id)
            ->assertJsonPath('data.carousel_images.1.id', $firstImage->id);

        $this->assertDatabaseHas('homepage_contents', [
            'site_name' => 'Trail Home',
            'headline' => 'Ride the best loops.',
        ]);
        $this->assertDatabaseHas('homepage_carousel_images', [
            'image_id' => $secondImage->id,
            'sort_order' => 0,
        ]);
    }

    public function test_admin_can_upload_homepage_image(): void
    {
        Storage::fake('public');
        Artisan::shouldReceive('call')
            ->once()
            ->with('image:create-sizes', \Mockery::on(fn (array $arguments): bool => isset($arguments['image'])))
            ->andReturn(0);

        $admin = User::factory()->create([
            'is_admin' => true,
        ]);

        $response = $this->actingAs($admin)->postJson('/api/admin/images', [
            'image' => UploadedFile::fake()->image('trail.jpg'),
            'description' => 'Trail overlook',
            'alt_text' => 'Mountain bike trail overlook',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.description', 'Trail overlook')
            ->assertJsonPath('data.alt_text', 'Mountain bike trail overlook');

        $this->assertDatabaseHas('images', [
            'description' => 'Trail overlook',
            'alt_text' => 'Mountain bike trail overlook',
        ]);
        $this->assertCount(1, Storage::disk('public')->allFiles('homepage/images/original'));
    }

    public function test_homepage_image_upload_requires_alt_text(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
        ]);

        $response = $this->actingAs($admin)->postJson('/api/admin/images', [
            'image' => UploadedFile::fake()->image('trail.jpg'),
            'alt_text' => '',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['alt_text']);
    }
}
