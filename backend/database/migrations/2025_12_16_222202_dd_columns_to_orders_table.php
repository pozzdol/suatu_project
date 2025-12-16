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
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (! Schema::hasColumn('orders', 'finishing')) {
                    $table->string('finishing')->nullable()->after('address');
                }
                if (! Schema::hasColumn('orders', 'tebal_plat')) {
                    $table->string('tebal_plat')->nullable()->after('finishing');
                }
                if (! Schema::hasColumn('orders', 'note')) {
                    $table->text('note')->nullable()->after('tebal_plat');
                }
                if (! Schema::hasColumn('orders', 'date_confirm')) {
                    $table->timestamp('date_confirm')->nullable()->after('note');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'finishing')) {
                    $table->dropColumn('finishing');
                }
                if (Schema::hasColumn('orders', 'tebal_plat')) {
                    $table->dropColumn('tebal_plat');
                }
                if (Schema::hasColumn('orders', 'note')) {
                    $table->dropColumn('note');
                }
                if (Schema::hasColumn('orders', 'date_confirm')) {
                    $table->dropColumn('date_confirm');
                }
            });
        }
    }
};
