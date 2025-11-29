<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raw_material_usage', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');
            $table->uuid('order_item_id');
            $table->uuid('product_id');
            $table->uuid('raw_material_id');
            $table->decimal('quantity_used', 10, 2);
            $table->timestamps();
            $table->softDeletes();
            $table->json('deleted')->nullable();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('product')->onDelete('restrict');
            $table->foreign('raw_material_id')->references('id')->on('raw_material')->onDelete('restrict');

            $table->index('order_id');
            $table->index('product_id');
            $table->index('raw_material_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_material_usage');
    }
};
