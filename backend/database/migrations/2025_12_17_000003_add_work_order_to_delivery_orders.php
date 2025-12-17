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
        Schema::table('delivery_orders', function (Blueprint $table) {
            // Add order_code if not exists
            if (!Schema::hasColumn('delivery_orders', 'order_code')) {
                $table->string('order_code', 50)->unique()->nullable()->after('id');
            }

            // Add work_order_id if not exists
            if (!Schema::hasColumn('delivery_orders', 'work_order_id')) {
                $table->string('work_order_id', 36)->nullable()->after('order_code');

                // Add foreign key for work_order_id
                $table->foreign('work_order_id')
                    ->references('id')
                    ->on('work_orders')
                    ->onDelete('cascade');

                $table->index('work_order_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->dropForeign(['work_order_id']);
            $table->dropIndex(['work_order_id']);
            $table->dropColumn(['order_code', 'work_order_id']);
        });
    }
};
