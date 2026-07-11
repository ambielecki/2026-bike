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
        Schema::table('images', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ride_id');
            $table->string('alt_text')->default('')->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('images', function (Blueprint $table) {
            $table->foreignId('ride_id')->after('id')->constrained()->cascadeOnDelete();
            $table->dropColumn('alt_text');
        });
    }
};
