<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('homepage_contents', function (Blueprint $table) {
            $table->dropColumn(['site_name', 'headline', 'intro']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('homepage_contents', function (Blueprint $table) {
            $table->string('site_name')->default('ShowMyRides');
            $table->string('headline')->default('Track every route and see where you have been');
            $table->text('intro')->nullable();
        });

        DB::table('homepage_contents')->update([
            'intro' => 'Keep a clean record of the trails you ride, remember the lines you liked, and build a personal map of every loop, climb, and descent. Even track rides from Zwift in Watopia or Makuri Islands.',
        ]);
    }
};
