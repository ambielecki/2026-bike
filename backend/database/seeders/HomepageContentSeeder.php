<?php

namespace Database\Seeders;

use App\Models\HomepageContent;
use Illuminate\Database\Seeder;

class HomepageContentSeeder extends Seeder
{
    /**
     * Seed the default homepage content.
     */
    public function run(): void
    {
        HomepageContent::query()->firstOrCreate([], HomepageContent::defaults());
    }
}
