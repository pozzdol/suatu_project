<?php

namespace App\Http\Controllers;

use App\Models\Departments;
use App\Models\Organization;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DepartmentController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $departments = Departments::where('deleted', null)->get();

            $payload = $departments->map(function ($department) {
                return [
                    'id' => $department->id,
                    'name' => $department->data['name'] ?? '',
                    'description' => $department->data['description'] ?? '',
                    'organization' => $department->data['organization'] ?? '',
                    'organization_name' => Organization::find($department->data['organization'])->data['name'] ?? '',
                ];
            });

            return $this->apiResponse(['departments' => $payload], 'Departments retrieved successfully.', true, 200);
        } catch (\Exception $e) {
            Log::error('Department retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve departments.', null, 500);
        }
    }

    public function create(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'description' => 'sometimes|string|max:500',
            'organization' => 'required|string|exists:organizations,id',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        try {
            $department = new Departments;
            $department->data = $validator->validated();
            $department->save();

            return $this->apiResponse(['department' => $department], 'Department created successfully.', true, 201);
        } catch (\Exception $e) {
            Log::error('Department creation error: '.$e->getMessage());

            return $this->apiError('Failed to create department.', null, 500);
        }
    }

    public function show($id)
    {
        try {
            $department = Departments::find($id);

            if (! $department) {
                return $this->apiError('Department not found.', null, 404);
            }

            $payload = [
                'id' => $department->id,
                'name' => $department->data['name'] ?? '',
                'description' => $department->data['description'] ?? '',
                'organization' => $department->data['organization'] ?? '',
            ];

            return $this->apiResponse(['department' => $payload], 'Department retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Department retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve department.', null, 500);
        }
    }

    public function showByOrganization($organizationId)
    {
        try {
            $departments = Departments::where('data->organization', $organizationId)
                ->where('deleted', null)
                ->get();

            $payload = $departments->map(function ($department) {
                return [
                    'id' => $department->id,
                    'created' => $department->created,
                    'updated' => $department->updated,
                    'deleted' => $department->deleted,
                    'name' => $department->data['name'] ?? '',
                    'description' => $department->data['description'] ?? '',
                    'organization' => $department->data['organization'] ?? '',
                ];
            });

            return $this->apiResponse(['departments' => $payload], 'Departments retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Department retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve departments.', null, 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $department = Departments::find($id);

            if (! $department) {
                return $this->apiError('Department not found.', null, 404);
            }

            $rules = [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'sometimes|string|max:500',
                'organization' => 'sometimes|required|string|exists:organizations,id',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $data = $department->data ?? [];
            $validated = $validator->validated();

            $department->data = array_merge($data, $validated);
            $department->save();

            $payload = [
                'id' => $department->id,
                'name' => $department->data['name'] ?? '',
                'description' => $department->data['description'] ?? '',
                'organization' => $department->data['organization'] ?? '',
            ];

            return $this->apiResponse(['department' => $payload], 'Department updated successfully.');
        } catch (\Exception $e) {
            Log::error('Department update error: '.$e->getMessage());

            return $this->apiError('Failed to update department.', null, 500);
        }
    }

    /**
     * Delete single department (soft delete)
     * ID bisa dari URL parameter atau dari body
     */
    public function destroy(Request $request, $id = null)
    {
        try {
            // Prioritaskan ID dari URL, fallback ke body
            $departmentId = $id ?? $request->input('id');

            if (! $departmentId) {
                return $this->apiError('Department ID is required.', null, 422);
            }

            $department = Departments::find($departmentId);

            if (! $department) {
                return $this->apiError('Department not found.', null, 404);
            }

            $department->delete();

            return $this->apiResponse(null, 'Department deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Department deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete department.', null, 500);
        }
    }

    /**
     * Mass delete departments (soft delete)
     * Expects array of IDs in body: { "ids": ["id1", "id2", ...] }
     */
    public function massDestroy(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required|string',
        ])->validate();

        try {
            $deletedCount = 0;
            $notFoundIds = [];

            foreach ($validated['ids'] as $departmentId) {
                $department = Departments::find($departmentId);

                if ($department) {
                    $department->delete();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $departmentId;
                }
            }

            $message = "{$deletedCount} department(s) deleted successfully.";
            if (! empty($notFoundIds)) {
                $message .= ' Not found: '.implode(', ', $notFoundIds);
            }

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            Log::error('Mass department deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete departments.', null, 500);
        }
    }
}
