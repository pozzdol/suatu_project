<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeliveryOrderController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\FinishedGoodsController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PermitController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RawMaterialController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RoleWindowController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WindowsController;
use App\Http\Controllers\WorkOrderController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Health check endpoint (no auth required)
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        return response()->json([
            'status' => 'healthy',
            'database' => 'connected',
            'timestamp' => now()->toISOString(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'unhealthy',
            'database' => 'disconnected',
            'error' => $e->getMessage(),
            'timestamp' => now()->toISOString(),
        ], 503);
    }
});

// Routes tanpa autentikasi
Route::post('/login', [AuthController::class, 'login']);

// Routes dengan autentikasi
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

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
    Route::get('/general/setup/organizations/list', [OrganizationController::class, 'index']);
    Route::post('/general/setup/organizations', [OrganizationController::class, 'create']);

    Route::get('/general/setup/organizations/edit/{id}', [OrganizationController::class, 'show']);
    Route::put('/general/setup/organizations/edit/{id}', [OrganizationController::class, 'update']);

    Route::post('/general/setup/organizations/mass-delete', [OrganizationController::class, 'massDestroy']);
    Route::delete('/general/setup/organizations/{id}', [OrganizationController::class, 'destroy']);
    Route::delete('/general/setup/organizations', [OrganizationController::class, 'destroy']);

    // Department Routes
    Route::get('/general/setup/departments/list', [DepartmentController::class, 'index']);
    Route::get('/general/setup/departments/organization/{organizationId}', [DepartmentController::class, 'showByOrganization']);
    Route::post('/general/setup/departments', [DepartmentController::class, 'create']);

    Route::get('/general/setup/departments/edit/{id}', [DepartmentController::class, 'show']);
    Route::put('/general/setup/departments/edit/{id}', [DepartmentController::class, 'update']);

    Route::post('/general/setup/departments/mass-delete', [DepartmentController::class, 'massDestroy']);
    Route::delete('/general/setup/departments/{id}', [DepartmentController::class, 'destroy']);
    Route::delete('/general/setup/departments', [DepartmentController::class, 'destroy']);

    // Raw Material Routes
    Route::get('/general/setup/raw-materials/list', [RawMaterialController::class, 'index']);
    Route::post('/general/setup/raw-materials', [RawMaterialController::class, 'create']);

    Route::get('/general/setup/raw-materials/edit/{id}', [RawMaterialController::class, 'show']);
    Route::put('/general/setup/raw-materials/edit/{id}', [RawMaterialController::class, 'update']);

    Route::post('/general/setup/raw-materials/mass-delete', [RawMaterialController::class, 'massDestroy']);
    Route::delete('/general/setup/raw-materials/{id}', [RawMaterialController::class, 'destroy']);
    Route::delete('/general/setup/raw-materials', [RawMaterialController::class, 'destroy']);

    // Product Routes
    Route::get('/general/setup/products/list', [ProductController::class, 'index']);
    Route::post('/general/setup/products', [ProductController::class, 'create']);

    Route::get('/general/setup/products/edit/{id}', [ProductController::class, 'show']);
    Route::put('/general/setup/products/edit/{id}', [ProductController::class, 'update']);

    Route::post('/general/setup/products/mass-delete', [ProductController::class, 'massDestroy']);
    Route::delete('/general/setup/products/{id}', [ProductController::class, 'destroy']);
    Route::delete('/general/setup/products', [ProductController::class, 'destroy']);

    // Order Routes
    Route::get('/transactions/orders/list', [OrdersController::class, 'index']);
    Route::post('/transactions/orders', [OrdersController::class, 'create']);

    Route::get('/transactions/orders/edit/{id}', [OrdersController::class, 'show']);
    Route::put('/transactions/orders/edit/{id}', [OrdersController::class, 'update']);

    Route::post('/transactions/orders/mass-delete', [OrdersController::class, 'massDestroy']);
    Route::delete('/transactions/orders/{id}', [OrdersController::class, 'destroy']);
    Route::delete('/transactions/orders', [OrdersController::class, 'destroy']);

    // Work Order Routes
    Route::get('/transactions/work-orders/list', [WorkOrderController::class, 'index']);

    Route::get('/transactions/work-orders/edit/{id}', [WorkOrderController::class, 'show']);
    Route::put('/transactions/work-orders/edit/{id}', [WorkOrderController::class, 'update']);
    Route::put('/transactions/work-orders/status/{id}', [WorkOrderController::class, 'updateStatus']);

    Route::post('/transactions/work-orders/mass-delete', [WorkOrderController::class, 'massDestroy']);
    Route::delete('/transactions/work-orders/{id}', [WorkOrderController::class, 'destroy']);
    Route::delete('/transactions/work-orders', [WorkOrderController::class, 'destroy']);

    // Finished Goods Routes
    Route::get('/transactions/finished-goods/list', [FinishedGoodsController::class, 'index']);
    Route::get('/transactions/finished-goods/work-order/{workOrderId}', [FinishedGoodsController::class, 'byWorkOrder']);
    Route::post('/transactions/finished-goods', [FinishedGoodsController::class, 'create']);

    Route::get('/transactions/finished-goods/edit/{id}', [FinishedGoodsController::class, 'show']);
    Route::put('/transactions/finished-goods/edit/{id}', [FinishedGoodsController::class, 'update']);

    Route::post('/transactions/finished-goods/mass-delete', [FinishedGoodsController::class, 'massDestroy']);
    Route::delete('/transactions/finished-goods/{id}', [FinishedGoodsController::class, 'destroy']);
    Route::delete('/transactions/finished-goods', [FinishedGoodsController::class, 'destroy']);

    // Delivery Order Routes
    Route::get('/transactions/delivery-orders/list', [DeliveryOrderController::class, 'index']);
    Route::get('/transactions/delivery-orders/order/{orderId}', [DeliveryOrderController::class, 'byOrder']);
    Route::post('/transactions/delivery-orders', [DeliveryOrderController::class, 'create']);

    Route::get('/transactions/delivery-orders/edit/{id}', [DeliveryOrderController::class, 'show']);
    Route::put('/transactions/delivery-orders/edit/{id}', [DeliveryOrderController::class, 'update']);
    Route::put('/transactions/delivery-orders/status/{id}', [DeliveryOrderController::class, 'updateStatus']);
    Route::put('/transactions/delivery-orders/delivered/{id}', [DeliveryOrderController::class, 'markDelivered']);

    Route::post('/transactions/delivery-orders/mass-delete', [DeliveryOrderController::class, 'massDestroy']);
    Route::delete('/transactions/delivery-orders/{id}', [DeliveryOrderController::class, 'destroy']);
    Route::delete('/transactions/delivery-orders', [DeliveryOrderController::class, 'destroy']);

    // Notification Routes
    Route::get('/notifications/users', [NotificationController::class, 'getUsers']);
    Route::get('/notifications/recipients', [NotificationController::class, 'getNotificationRecipients']);
    Route::get('/notifications/low-stock-materials', [NotificationController::class, 'getLowStockMaterials']);
    Route::put('/notifications/users/{id}/preference', [NotificationController::class, 'updateUserNotificationPreference']);
    Route::post('/notifications/users/bulk-preference', [NotificationController::class, 'bulkUpdateNotificationPreference']);
});
