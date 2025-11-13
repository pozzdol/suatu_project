<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ['users', 'roles', 'windows', 'role_windows'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                // hanya tambahkan deleted_at jika belum ada
                if (! Schema::hasColumn($tableName, 'deleted_at')) {
                    $table->softDeletes(); // menambah deleted_at TIMESTAMP NULL
                }

                // tambah kolom JSON 'deleted' jika memang ingin metadata
                if (! Schema::hasColumn($tableName, 'deleted')) {
                    // gunakan json() bila DB mendukung, fallback ke text bila perlu
                    $table->json('deleted')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        $tables = ['users', 'roles', 'windows', 'role_windows'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($tableName, 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
                if (Schema::hasColumn($tableName, 'deleted')) {
                    $table->dropColumn('deleted');
                }
            });
        }
    }
};
