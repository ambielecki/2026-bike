<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->string('system_key')->nullable()->unique()->after('user_id');
            $table->string('map_provider')->default('openstreetmap')->after('system_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropUnique(['system_key']);
            $table->dropColumn(['system_key', 'map_provider']);
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};
