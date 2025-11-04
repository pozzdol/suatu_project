<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PermitController;
use App\Http\Controllers\WindowsController;

// Routes tanpa autentikasi
Route::post('/login', [AuthController::class, 'login']);

// Routes dengan autentikasi
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);

    // Permit Routes
    Route::post('/validation/permit/{access}', [PermitController::class, 'permit']);

    // Windows Routes
    Route::get('/general/setup/windows', [WindowsController::class, 'menu']);
});
