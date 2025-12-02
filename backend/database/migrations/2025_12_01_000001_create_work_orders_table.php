<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('work_orders')) {
            Schema::create('work_orders', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('order_id')->index();
                $table->string('no_surat', 100)->unique();
                $table->text('description')->nullable();
                $table->string('status', 50)->default('pending');
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->softDeletes();
                $table->json('deleted')->nullable();

                $table
                    ->foreign('order_id')
                    ->references('id')
                    ->on('orders')
                    ->cascadeOnUpdate()
                    ->cascadeOnDelete();
            });

            return;
        }

        if (! Schema::hasColumn('work_orders', 'order_id')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->uuid('order_id')->nullable()->after('id');
            });
        }

        if (! Schema::hasColumn('work_orders', 'status')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->string('status', 50)->default('pending')->after('description');
            });
        }

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

        if (Schema::hasColumn('work_orders', 'no_surat')) {
            try {
                Schema::table('work_orders', function (Blueprint $table) {
                    $table->unique('no_surat');
                });
            } catch (\Exception $e) {
                // index already exists
            }
        }

        if (Schema::hasColumn('work_orders', 'order_id')) {
            try {
                Schema::table('work_orders', function (Blueprint $table) {
                    $table->index('order_id');
                });
            } catch (\Exception $e) {
                // index already exists
            }

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
                // foreign key already exists
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('work_orders');
    }
};
