<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add descriptive information to technical aids.
     */
    public function up(): void
    {
        Schema::table('technical_aids', function (Blueprint $table) {
            $table->string('name')->nullable()->after('category_id');
            $table->text('description')->nullable()->after('reference');
            $table->string('image_path')->nullable()->after('description');
        });
    }

    /**
     * Remove the descriptive information.
     */
    public function down(): void
    {
        Schema::table('technical_aids', function (Blueprint $table) {
            $table->dropColumn([
                'name',
                'description',
                'image_path',
            ]);
        });
    }
};
