<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->string('full_name')->after('id');
            $table->string('identification_number')->unique()->after('full_name');
        });
    }

    public function down(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->dropUnique(['identification_number']);
            $table->dropColumn(['full_name', 'identification_number']);
        });
    }
};
