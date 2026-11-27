<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('loan_id')
                ->constrained('loans')
                ->restrictOnDelete();

            $table->foreignUuid('technical_aid_id')
                ->constrained('technical_aids')
                ->restrictOnDelete();

            $table->string('reference_snapshot');
            $table->string('category_snapshot');

            $table->timestamp('due_at');
            $table->timestamp('returned_at')->nullable();

            $table->timestamps();

            $table->index(['loan_id', 'returned_at']);
            $table->index(['due_at', 'returned_at']);
            $table->index(['technical_aid_id', 'returned_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_lines');
    }
};
