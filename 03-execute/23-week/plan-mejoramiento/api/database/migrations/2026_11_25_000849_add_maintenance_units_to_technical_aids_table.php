
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('technical_aids', function (Blueprint $table) {
            $table->unsignedInteger('maintenance_units')
                ->default(0)
                ->after('available_units');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE technical_aids
                 ADD CONSTRAINT chk_technical_aids_inventory_units
                 CHECK (available_units + maintenance_units <= total_units)'
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE technical_aids
                 DROP CHECK chk_technical_aids_inventory_units'
            );
        }

        Schema::table('technical_aids', function (Blueprint $table) {
            $table->dropColumn('maintenance_units');
        });
    }
};
