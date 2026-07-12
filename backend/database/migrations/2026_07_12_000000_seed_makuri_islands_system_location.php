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
            ['system_key' => 'makuri-islands'],
            [
                'name' => 'Makuri Islands',
                'user_id' => null,
                'map_provider' => 'makuri-islands',
                'latitude' => -10.780440,
                'longitude' => 165.829354,
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
            ->where('system_key', 'makuri-islands')
            ->delete();
    }
};
