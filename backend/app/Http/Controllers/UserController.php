<?php

namespace App\Http\Controllers;

use App\Mail\UserCreated;
use App\Models\Departments;
use App\Models\Organization;
use App\Models\Role;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $data = User::all();

        $payload = $data->map(function ($user) {
            $roleName = Role::find($user->role_id);

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_id' => $user->role_id,
                'role_name' => $roleName ? $roleName->data['name'] : null,
                'employee_id' => $user->employee_id,
                'department_id' => $user->department_id,
                'department_name' => Departments::find($user->department_id)->data['name'] ?? null,
                'organization_id' => $user->organization_id,
                'organization_name' => Organization::find($user->organization_id)->data['name'] ?? null,
            ];
        });

        return $this->apiResponse(['users' => $payload], 'Users retrieved successfully.');
    }

    public function create(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'employee_id' => 'nullable|string|max:100|unique:users,employee_id',
            'password' => 'required|string|min:4',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'employee_id' => $request->employee_id,
            'password' => bcrypt($request->password),
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        try {
            Mail::to($user->email)->send(new UserCreated($user, $request->password));
        } catch (\Exception $e) {
            Log::error('Failed to send email: '.$e->getMessage());
            // Optional: tetap return success meskipun email gagal
        }

        return $this->apiResponse(['user' => $user], 'User created successfully.');
    }

    public function show($id)
    {
        $user = User::find($id);

        return $this->apiResponse(['user' => $user], 'User retrieved successfully.');
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (! $user) {
            return $this->apiError('User not found.', null, 404);
        }

        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'employee_id' => 'nullable|string|max:100',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,'.$id,
            'role_id' => 'sometimes|required|exists:roles,id',
            'department_id' => 'nullable|exists:departments,id',
            'organization_id' => 'nullable|exists:organizations,id',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        if ($request->has('name')) {
            $user->name = $request->name;
        }
        if ($request->has('employee_id')) {
            $user->employee_id = $request->employee_id;
        }
        if ($request->has('email')) {
            $user->email = $request->email;
        }
        if ($request->has('role_id')) {
            $user->role_id = $request->role_id;
        }
        if ($request->has('department_id')) {
            $user->department_id = $request->department_id;
        }
        if ($request->has('organization_id')) {
            $user->organization_id = $request->organization_id;
        }
        $user->updated_by = Auth::id();
        $user->save();

        return $this->apiResponse(['user' => $user], 'User updated successfully.');
    }

    /**
     * Delete single user (soft delete)
     * ID bisa dari URL parameter atau dari body
     */
    public function destroy(Request $request, $id = null)
    {
        try {
            // Prioritaskan ID dari URL, fallback ke body
            $userId = $id ?? $request->input('id');

            if (! $userId) {
                return $this->apiError('User ID is required.', null, 422);
            }

            $user = User::find($userId);

            if (! $user) {
                return $this->apiError('User not found.', null, 404);
            }

            $user->delete();

            return $this->apiResponse(null, 'User deleted successfully.');
        } catch (\Exception $e) {
            Log::error('User deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete user.', null, 500);
        }
    }

    /**
     * Mass delete users (soft delete)
     * Expects array of IDs in body: { "ids": ["id1", "id2", ...] }
     */
    public function massDestroy(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required', // Menggunakan integer atau string tergantung tipe ID user
        ])->validate();

        try {
            $deletedCount = 0;
            $notFoundIds = [];

            foreach ($validated['ids'] as $userId) {
                $user = User::find($userId);

                if ($user) {
                    $user->delete();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $userId;
                }
            }

            $message = "{$deletedCount} user(s) deleted successfully.";
            if (! empty($notFoundIds)) {
                $message .= ' Not found: '.implode(', ', $notFoundIds);
            }

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            Log::error('Mass user deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete users.', null, 500);
        }
    }
}
