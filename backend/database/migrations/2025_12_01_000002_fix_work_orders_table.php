<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('work_orders')) {
            // Add order_id if missing
            if (! Schema::hasColumn('work_orders', 'order_id')) {
                Schema::table('work_orders', function (Blueprint $table) {
                    $table->uuid('order_id')->nullable()->after('id');
                    $table->index('order_id');
                });
            }

            // Add foreign key constraint if order_id exists but no constraint yet
            if (Schema::hasColumn('work_orders', 'order_id')) {
                try {
                    Schema::table('work_orders', function (Blueprint $table) {
                        $table
                            ->foreign('order_id')
                            ->references('id')
                            ->on('orders')
                            ->cascadeOnUpdate()
                            ->cascadeOnDelete();
                    });
                } catch (\Exception $e) {
                    // Foreign key already exists
                }
            }

            // Add status if missing
            if (! Schema::hasColumn('work_orders', 'status')) {
                Schema::table('work_orders', function (Blueprint $table) {
                    $table->string('status', 50)->default('pending')->after('description');
                });
            }

            // Add no_surat unique constraint if missing
            if (Schema::hasColumn('work_orders', 'no_surat')) {
                try {
                    Schema::table('work_orders', function (Blueprint $table) {
                        $table->unique('no_surat');
                    });
                } catch (\Exception $e) {
                    // Unique constraint already exists
                }
            }

            // Ensure soft deletes columns exist
            if (! Schema::hasColumn('work_orders', 'deleted_at')) {
                Schema::table('work_orders', function (Blueprint $table) {
                    $table->softDeletes();
                });
            }

            if (! Schema::hasColumn('work_orders', 'deleted')) {
                Schema::table('work_orders', function (Blueprint $table) {
                    $table->json('deleted')->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        // This is a fix migration, reverting would be complex
        // Leave table structure as-is
    }
};
