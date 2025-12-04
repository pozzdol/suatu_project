<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify status column to ENUM with correct values
        DB::statement("ALTER TABLE delivery_orders MODIFY COLUMN status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to VARCHAR if needed
        DB::statement("ALTER TABLE delivery_orders MODIFY COLUMN status VARCHAR(255) DEFAULT 'pending'");
    }
};
