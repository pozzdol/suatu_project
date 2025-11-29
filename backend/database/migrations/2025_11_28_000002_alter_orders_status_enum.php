<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Alter ENUM untuk kolom status di tabel orders
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('draft', 'confirm', 'pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        // Kembalikan ke ENUM sebelumnya
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending'");
    }
};
