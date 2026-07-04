<?php

namespace Database\Factories;

use App\Models\Location;
use App\Models\Ride;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ride>
 */
class RideFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
            'user_id' => User::factory(),
            'location_id' => Location::factory(),
            'datetime' => now(),
            'route_data' => [],
            'distance' => fake()->randomFloat(2, 1, 90),
            'total_time' => fake()->randomFloat(2, 600, 20000),
            'moving_time' => fake()->randomFloat(2, 600, 20000),
            'average_speed' => fake()->randomFloat(2, 5, 25),
            'max_speed' => fake()->randomFloat(2, 10, 45),
        ];
    }
}
