<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PermitController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RoleWindowController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WindowsController;
use Illuminate\Support\Facades\Route;

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
    Route::get('/general/setup/windows/tree', [WindowsController::class, 'tree']);
    Route::get('/general/setup/windows/parents', [WindowsController::class, 'parent']);
    Route::get('/general/setup/windows/list', [WindowsController::class, 'list']);
    Route::post('/general/setup/windows', [WindowsController::class, 'create']);

    Route::get('/general/setup/windows/edit/{id}', [WindowsController::class, 'show']);
    Route::put('/general/setup/windows/edit/{id}', [WindowsController::class, 'update']);

    Route::post('/general/setup/windows/mass-delete', [WindowsController::class, 'massDestroy']);
    Route::delete('/general/setup/windows/{id}', [WindowsController::class, 'destroy']);
    Route::delete('/general/setup/windows', [WindowsController::class, 'destroy']);

    // Roles Routes
    Route::get('/general/setup/roles/list', [RoleController::class, 'index']);
    Route::post('/general/setup/roles', [RoleController::class, 'create']);

    Route::get('/general/setup/roles/edit/{id}', [RoleController::class, 'show']);
    Route::put('/general/setup/roles/edit/{id}', [RoleController::class, 'update']);

    Route::post('/general/setup/roles/mass-delete', [RoleController::class, 'massDestroy']);
    Route::delete('/general/setup/roles/{id}', [RoleController::class, 'destroy']);
    Route::delete('/general/setup/roles', [RoleController::class, 'destroy']);

    Route::get('/general/setup/roles/usage/{roleId}', [RoleController::class, 'usage']);

    // Role Windows Routes
    Route::get('/general/setup/role-windows/role-id/{id}', [RoleWindowController::class, 'index']);
    Route::post('/general/setup/role-windows', [RoleWindowController::class, 'create']);

    // User Management Route
    Route::get('/general/setup/users/list', [UserController::class, 'index']);
    Route::post('/general/setup/users', [UserController::class, 'create']);

    Route::get('/general/setup/users/edit/{id}', [UserController::class, 'show']);
    Route::put('/general/setup/users/edit/{id}', [UserController::class, 'update']);

    Route::post('/general/setup/users/mass-delete', [UserController::class, 'massDestroy']);
    Route::delete('/general/setup/users/{id}', [UserController::class, 'destroy']);
    Route::delete('/general/setup/users', [UserController::class, 'destroy']);

    // Organization Routes
    Route::post('/general/setup/organizations', [OrganizationController::class, 'create']);
});
