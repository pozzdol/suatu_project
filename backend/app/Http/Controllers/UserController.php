<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
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
                'organization_id' => $user->organization_id,
            ];
        });

        return $this->apiResponse(['users' => $payload], 'Users retrieved successfully.');
    }

    public function create(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'employee_id' => 'nullable|string|max:100',
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

        if (!$user) {
            return $this->apiError('User not found.', null, 404);
        }

        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'employee_id' => 'nullable|string|max:100',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
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
        $user->updated_by = Auth::id();
        $user->save();

        return $this->apiResponse(['user' => $user], 'User updated successfully.');
    }
}
