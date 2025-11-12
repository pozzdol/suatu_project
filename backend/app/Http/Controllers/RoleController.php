<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\RoleWindow;
use App\Models\Window;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    use ApiResponse;

    private function getPermit($userRoleId, $accessId)
    {
        $window = Window::where('data_access_id', $accessId)
            ->whereNull('deleted')
            ->first();

        if (! $window) {
            return null;
        }

        $permit = RoleWindow::where('role_id', $userRoleId)
            ->where('window_id', $window->id)
            ->whereNull('deleted')
            ->first();

        if (! $permit || ! $permit->isEdit) {
            return false;
        }

        return true;
    }

    public function index()
    {
        $roleData = Role::whereNull('deleted')
            ->orderBy('data->name', 'asc')
            ->get();

        $payload = $roleData->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->data['name'] ?? null,
                'description' => $role->data['description'] ?? null,
            ];
        });

        return $this->apiResponse(['roles' => $payload], 'Roles retrieved successfully.');
    }

    public function show($id)
    {
        $roleData = Role::where('id', $id)
            ->whereNull('deleted')
            ->first();

        if (!$roleData) {
            return $this->apiError('Role not found.', null, 404);
        }

        $payload = [
            'id' => $roleData->id,
            'name' => $roleData->data['name'] ?? null,
            'description' => $roleData->data['description'] ?? null,
        ];

        return $this->apiResponse(['role' => $payload], 'Role retrieved successfully.');
    }

    public function create(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ];

        $userRoleId = Auth::user()->role_id;
        $permit = $this->getPermit($userRoleId, '17df972f2f8345b1b46d9b29c03c0934');

        if (! $permit) {
            return $this->apiError('Unauthorized to create role.', null, 403);
        }

        $extra = array_diff(array_keys($request->all()), array_keys($rules));
        if (! empty($extra)) {
            return $this->apiError('Invalid fields: ' . implode(', ', $extra), null, 422);
        }

        $validated = Validator::make($request->all(), $rules)->validate();


        try {
            $role = new Role;
            $role->data = $validated;
            $role->save();

            return $this->apiResponse($role, 'Role created successfully.', true, 201);
        } catch (\Exception $e) {
            Log::error('Role creation error: ' . $e->getMessage());

            return $this->apiError('Failed to create role.', null, 500);
        }
    }

    public function update(Request $request, $id)
    {
        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
        ];

        $userRoleId = Auth::user()->role_id;
        $permit = $this->getPermit($userRoleId, '17df972f2f8345b1b46d9b29c03c0934');

        if (! $permit) {
            return $this->apiError('Unauthorized to update role.', null, 403);
        }

        $extra = array_diff(array_keys($request->all()), array_keys($rules));
        if (! empty($extra)) {
            return $this->apiError('Invalid fields: ' . implode(', ', $extra), null, 422);
        }

        $validated = Validator::make($request->all(), $rules)->validate();

        try {
            $role = Role::where('id', $id)->whereNull('deleted')->first();

            if (! $role) {
                return $this->apiError('Role not found.', null, 404);
            }

            $role->data = array_merge($role->data, $validated);
            $role->save();

            $payload = [
                'id' => $role->id,
                'name' => $role->data['name'] ?? null,
                'description' => $role->data['description'] ?? null,
            ];

            return $this->apiResponse(['role' => $payload], 'Role updated successfully.');
        } catch (\Exception $e) {
            Log::error('Role update error: ' . $e->getMessage());

            return $this->apiError('Failed to update role.', null, 500);
        }
    }
}
