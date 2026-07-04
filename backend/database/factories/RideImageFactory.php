<?php

namespace Database\Factories;

use App\Models\Ride;
use App\Models\RideImage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RideImage>
 */
class RideImageFactory extends Factory
{
    protected $model = RideImage::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ride_id' => Ride::factory(),
            'user_id' => User::factory(),
            'name' => fake()->uuid().'.jpg',
            'description' => null,
            'has_sizes' => false,
        ];
    }
}
