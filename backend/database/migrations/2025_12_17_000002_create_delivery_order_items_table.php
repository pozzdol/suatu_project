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
        Schema::create('delivery_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('delivery_order_id');
            $table->uuid('product_id');
            $table->string('product_name', 255);
            $table->integer('quantity');
            $table->string('unit', 20)->nullable();
            $table->timestamps();

            $table->foreign('delivery_order_id')
                ->references('id')
                ->on('delivery_orders')
                ->onDelete('cascade');

            $table->foreign('product_id')
                ->references('id')
                ->on('product')
                ->onDelete('cascade');

            $table->index('delivery_order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_order_items');
    }
};
