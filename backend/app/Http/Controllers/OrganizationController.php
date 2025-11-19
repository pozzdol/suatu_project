<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class OrganizationController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $organizations = Organization::all();

        $payload = $organizations->map(function ($organization) {
            return [
                'id' => $organization->id,
                'name' => $organization->data['name'],
                'address' => $organization->data['address'] ?? null,
                'is_active' => $organization->data['is_active'],
            ];
        });

        return $this->apiResponse(['organizations' => $payload], 'Organization retrieved successfully.', true, 200);
    }

    public function create(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'address' => 'string|max:500',
            'is_active' => 'required|boolean',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        try {
            $organization = new Organization;
            $organization->data = $validator->validated();
            $organization->save();

            return $this->apiResponse(['organizations' => $organization], 'Organization created successfully.', true, 201);
        } catch (\Exception $e) {
            Log::error('Organization creation error: '.$e->getMessage());

            return $this->apiError('Failed to create organization.', null, 500);
        }
    }

    public function show($id)
    {
        try {
            $organization = Organization::find($id);

            if (! $organization) {
                return $this->apiError('Organization not found.', null, 404);
            }

            $payload = [
                'id' => $organization->id,
                'name' => $organization->data['name'] ?? '',
                'address' => $organization->data['address'] ?? '',
                'is_active' => $organization->data['is_active'] ?? false,
            ];

            return $this->apiResponse(['organizations' => $payload], 'Organization retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Organization retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve organization.', null, 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $organization = Organization::find($id);

            if (! $organization) {
                return $this->apiError('Organization not found.', null, 404);
            }

            $rules = [
                'name' => 'sometimes|required|string|max:255',
                'address' => 'sometimes|string|max:500',
                'is_active' => 'sometimes|required|boolean',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $data = $organization->data ?? [];
            $validated = $validator->validated();

            $organization->data = array_merge($data, $validated);
            $organization->save();

            $payload = [
                'id' => $organization->id,
                'created' => $organization->created,
                'updated' => $organization->updated,
                'deleted' => $organization->deleted,
                'name' => $organization->data['name'] ?? '',
                'address' => $organization->data['address'] ?? '',
                'is_active' => $organization->data['is_active'] ?? false,
            ];

            return $this->apiResponse(['organizations' => $payload], 'Organization updated successfully.');
        } catch (\Exception $e) {
            Log::error('Organization update error: '.$e->getMessage());

            return $this->apiError('Failed to update organization.', null, 500);
        }
    }

    /**
     * Delete single organization (soft delete)
     * ID bisa dari URL parameter atau dari body
     */
    public function destroy(Request $request, $id = null)
    {
        try {
            // Prioritaskan ID dari URL, fallback ke body
            $organizationId = $id ?? $request->input('id');

            if (! $organizationId) {
                return $this->apiError('Organization ID is required.', null, 422);
            }

            $organization = Organization::find($organizationId);

            if (! $organization) {
                return $this->apiError('Organization not found.', null, 404);
            }

            $organization->delete();

            return $this->apiResponse(null, 'Organization deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Organization deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete organization.', null, 500);
        }
    }

    /**
     * Mass delete organizations (soft delete)
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

            foreach ($validated['ids'] as $organizationId) {
                $organization = Organization::find($organizationId);

                if ($organization) {
                    $organization->delete();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $organizationId;
                }
            }

            $message = "{$deletedCount} organization(s) deleted successfully.";
            if (! empty($notFoundIds)) {
                $message .= ' Not found: '.implode(', ', $notFoundIds);
            }

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            Log::error('Mass organization deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete organizations.', null, 500);
        }
    }
}
