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
        Schema::create('windows', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->json('data')->nullable();
            $table->integer('data_order_id')->storedAs('CAST(JSON_EXTRACT(data, "$.order") AS UNSIGNED)')->nullable();
            $table->string('data_access_id')->storedAs('JSON_EXTRACT(data, "$.access")')->nullable();
            $table->string('data_isParent_id')->storedAs('JSON_EXTRACT(data, "$.isParent")')->nullable();
            $table->json('created')->nullable();
            $table->json('updated')->nullable();
            $table->json('deleted')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('windows');
    }
};
