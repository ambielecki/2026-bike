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
        Schema::table('rides', function (Blueprint $table) {
            $table->renameColumn('duration', 'total_time');
        });

        Schema::table('rides', function (Blueprint $table) {
            $table->decimal('moving_time', 10, 2)->nullable()->after('total_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->dropColumn('moving_time');
        });

        Schema::table('rides', function (Blueprint $table) {
            $table->renameColumn('total_time', 'duration');
        });
    }
};
