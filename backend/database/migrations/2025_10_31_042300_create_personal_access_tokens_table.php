<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->bigIncrements('id');

            // cocokkan dengan users.id = varchar(32)
            $table->string('tokenable_type');
            $table->string('tokenable_id', 32);
            $table->index(['tokenable_type', 'tokenable_id']);

            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            // pakai precision 0 agar match kolom timestamp(0) kamu
            $table->timestamps(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
