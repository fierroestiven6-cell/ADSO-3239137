<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technical_aids', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('category_id')
                ->constrained('technical_aid_categories');

            $table->string('reference')->unique();

            $table->unsignedInteger('total_units');
            $table->unsignedInteger('available_units');

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['is_active', 'category_id']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE technical_aids
                 ADD CONSTRAINT chk_technical_aids_available_units
                 CHECK (available_units <= total_units)'
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('technical_aids');
    }
};
