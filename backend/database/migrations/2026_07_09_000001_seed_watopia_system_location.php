<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('locations')->updateOrInsert(
            ['system_key' => 'watopia'],
            [
                'name' => 'Watopia',
                'user_id' => null,
                'map_provider' => 'watopia',
                'latitude' => -11.683420,
                'longitude' => 166.955010,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('locations')
            ->where('system_key', 'watopia')
            ->delete();
    }
};
