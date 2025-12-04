<?php

namespace App\Http\Controllers;

use App\Models\RawMaterial;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * Get all users with notification status
     */
    public function getUsers()
    {
        try {
            $users = User::with('role')
                ->select('id', 'name', 'email', 'receive_stock_notification', 'role_id')
                ->orderBy('name', 'asc')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'receive_stock_notification' => $user->receive_stock_notification,
                        'role_id' => $user->role_id,
                        'role_name' => $user->role?->data['name'] ?? null,
                    ];
                });

            return $this->apiResponse(['users' => $users], 'Users retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Get users for notification error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve users.', null, 500);
        }
    }

    /**
     * Update user notification preference
     */
    public function updateUserNotificationPreference(Request $request, $id)
    {
        $rules = [
            'receive_stock_notification' => 'required|boolean',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        try {
            $user = User::find($id);

            if (! $user) {
                return $this->apiError('User not found.', null, 404);
            }

            $user->receive_stock_notification = $request->receive_stock_notification;
            $user->save();

            return $this->apiResponse([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'receive_stock_notification' => $user->receive_stock_notification,
                ],
            ], 'User notification preference updated successfully.');
        } catch (\Exception $e) {
            Log::error('Update user notification preference error: '.$e->getMessage());

            return $this->apiError('Failed to update user preference.', null, 500);
        }
    }

    /**
     * Bulk update user notification preferences
     * Users in the list will be set to the given value
     * Users NOT in the list will be set to the opposite value
     */
    public function bulkUpdateNotificationPreference(Request $request)
    {
        $rules = [
            'userIds' => 'required|array|min:1',
            'userIds.*' => 'required|string|exists:users,id',
            'receive_stock_notification' => 'required|boolean',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        try {
            $validated = $validator->validated();
            $userIds = $validated['userIds'];
            $value = $validated['receive_stock_notification'];

            // Set users in list to the given value
            User::whereIn('id', $userIds)
                ->update(['receive_stock_notification' => $value]);

            // Set users NOT in list to the opposite value
            User::whereNotIn('id', $userIds)
                ->update(['receive_stock_notification' => ! $value]);

            return $this->apiResponse([
                'enabled_count' => $value ? count($userIds) : User::where('receive_stock_notification', true)->count(),
                'disabled_count' => $value ? User::where('receive_stock_notification', false)->count() : count($userIds),
            ], 'User notification preferences updated successfully.');
        } catch (\Exception $e) {
            Log::error('Bulk update notification preference error: '.$e->getMessage());

            return $this->apiError('Failed to update user preferences.', null, 500);
        }
    }

    /**
     * Get raw materials with low stock (< threshold)
     */
    public function getLowStockMaterials(Request $request)
    {
        try {
            $threshold = $request->get('threshold', 500);

            $lowStockMaterials = RawMaterial::whereNull('deleted_at')
                ->whereRaw("CAST(JSON_EXTRACT(data, '$.stock') AS UNSIGNED) < ?", [$threshold])
                ->get()
                ->map(function ($material) use ($threshold) {
                    return [
                        'id' => $material->id,
                        'name' => $material->data['name'] ?? null,
                        'stock' => $material->data['stock'] ?? 0,
                        'unit' => $material->data['unit'] ?? null,
                        'minStock' => $threshold,
                    ];
                });

            return $this->apiResponse([
                'lowStockMaterials' => $lowStockMaterials,
                'count' => $lowStockMaterials->count(),
                'threshold' => $threshold,
            ], 'Low stock materials retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Get low stock materials error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve low stock materials.', null, 500);
        }
    }

    /**
     * Get users who receive stock notifications
     */
    public function getNotificationRecipients()
    {
        try {
            $users = User::whereNull('deleted_at')
                ->where('receive_stock_notification', true)
                ->select('id', 'name', 'email')
                ->orderBy('name', 'asc')
                ->get();

            return $this->apiResponse([
                'recipients' => $users,
                'count' => $users->count(),
            ], 'Notification recipients retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Get notification recipients error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve notification recipients.', null, 500);
        }
    }
}
