<?php

namespace Database\Seeders;

use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        Location::query()->updateOrCreate(
            ['system_key' => Location::SYSTEM_KEY_WATOPIA],
            Location::watopiaAttributes(),
        );

        Location::query()->updateOrCreate(
            ['system_key' => Location::SYSTEM_KEY_MAKURI_ISLANDS],
            Location::makuriIslandsAttributes(),
        );

        $this->call(HomepageContentSeeder::class);
    }
}
