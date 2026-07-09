<?php

namespace Database\Factories;

use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Location>
 */
class LocationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->city(),
            'user_id' => User::factory(),
            'system_key' => null,
            'map_provider' => Location::MAP_PROVIDER_OPENSTREETMAP,
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
        ];
    }

    public function watopia(): static
    {
        return $this->state(fn (): array => Location::watopiaAttributes());
    }
}
