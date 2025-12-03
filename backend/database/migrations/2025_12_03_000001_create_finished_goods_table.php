<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('finished_goods');

        Schema::create('finished_goods', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('work_order_id', 36)->collation('utf8mb4_0900_ai_ci')->index();
            $table->char('product_id', 36)->index();
            $table->integer('quantity')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('produced_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->softDeletes();
            $table->json('deleted')->nullable();
        });

        Schema::table('finished_goods', function (Blueprint $table) {
            $table
                ->foreign('work_order_id')
                ->references('id')
                ->on('work_orders')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table
                ->foreign('product_id')
                ->references('id')
                ->on('product')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finished_goods');
    }
};
