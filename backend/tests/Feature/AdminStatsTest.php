<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\Ride;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_admin_stats(): void
    {
        $this->getJson('/api/admin/stats')
            ->assertUnauthorized();
    }

    public function test_non_admin_cannot_view_admin_stats(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
        ]);

        $this->actingAs($user)
            ->getJson('/api/admin/stats')
            ->assertForbidden();
    }

    public function test_admin_can_view_user_and_route_counts(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'created_at' => now()->subDays(10),
        ]);
        User::factory()->count(2)->create([
            'created_at' => now()->subDays(2),
        ]);
        User::factory()->create([
            'created_at' => now()->subDays(8),
        ]);
        $location = Location::factory()->create([
            'user_id' => $admin->id,
        ]);

        Ride::factory()->count(3)->create([
            'user_id' => $admin->id,
            'location_id' => $location->id,
            'created_at' => now()->subDays(3),
        ]);
        Ride::factory()->count(2)->create([
            'user_id' => $admin->id,
            'location_id' => $location->id,
            'created_at' => now()->subDays(9),
        ]);

        $this->actingAs($admin)
            ->getJson('/api/admin/stats')
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'total_users' => 4,
                    'new_users_last_7_days' => 2,
                    'total_routes_logged' => 5,
                    'routes_logged_last_7_days' => 3,
                ],
            ]);
    }
}
