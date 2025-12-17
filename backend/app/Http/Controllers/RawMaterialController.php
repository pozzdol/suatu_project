<?php

namespace App\Http\Controllers;

use App\Models\RawMaterial;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RawMaterialController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $rawMaterials = RawMaterial::where('deleted', null)->get();

            $payload = $rawMaterials->map(function ($raw) {
                return [
                    'id' => $raw->id,
                    'created' => $raw->created,
                    'updated' => $raw->updated,
                    'deleted' => $raw->deleted,
                    'name' => $raw->data['name'] ?? '',
                    'stock' => $raw->data['stock'] ?? 0,
                    'unit' => $raw->data['unit'] ?? '',
                    'lowerLimit' => $raw->data['lowerLimit'] ?? 0,
                ];
            });

            return $this->apiResponse(['rawMaterials' => $payload], 'Raw materials retrieved successfully.', true, 200);
        } catch (\Exception $e) {
            Log::error('Raw material retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve raw materials.', null, 500);
        }
    }

    public function create(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'stock' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'lowerLimit' => 'nullable|numeric|min:0',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        try {
            $validated = $validator->validated();

            // Set default value for unit if not provided
            if (! isset($validated['unit']) || empty($validated['unit'])) {
                $validated['unit'] = 'pcs';
            }

            $raw = new RawMaterial;
            $raw->data = $validated;
            $raw->save();

            $payload = [
                'id' => $raw->id,
                'created' => $raw->created,
                'updated' => $raw->updated,
                'deleted' => $raw->deleted,
                'name' => $raw->data['name'] ?? '',
                'stock' => $raw->data['stock'] ?? 0,
                'unit' => $raw->data['unit'] ?? '',
                'lowerLimit' => $raw->data['lowerLimit'] ?? 0,
            ];

            return $this->apiResponse(['rawMaterial' => $payload], 'Raw material created successfully.', true, 201);
        } catch (\Exception $e) {
            Log::error('Raw material creation error: '.$e->getMessage());

            return $this->apiError('Failed to create raw material.', null, 500);
        }
    }

    public function show($id)
    {
        try {
            $raw = RawMaterial::find($id);

            if (! $raw) {
                return $this->apiError('Raw material not found.', null, 404);
            }

            $payload = [
                'id' => $raw->id,
                'created' => $raw->created,
                'updated' => $raw->updated,
                'deleted' => $raw->deleted,
                'name' => $raw->data['name'] ?? '',
                'stock' => $raw->data['stock'] ?? 0,
                'unit' => $raw->data['unit'] ?? '',
                'lowerLimit' => $raw->data['lowerLimit'] ?? 0,
            ];

            return $this->apiResponse(['rawMaterial' => $payload], 'Raw material retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Raw material retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve raw material.', null, 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $raw = RawMaterial::find($id);

            if (! $raw) {
                return $this->apiError('Raw material not found.', null, 404);
            }

            $rules = [
                'name' => 'sometimes|required|string|max:255',
                'stock' => 'sometimes|required|numeric|min:0',
                'unit' => 'sometimes|nullable|string|max:50',
                'lowerLimit' => 'sometimes|nullable|numeric|min:0',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $data = $raw->data ?? [];
            $validated = $validator->validated();

            $raw->data = array_merge($data, $validated);
            $raw->save();

            $payload = [
                'id' => $raw->id,
                'created' => $raw->created,
                'updated' => $raw->updated,
                'deleted' => $raw->deleted,
                'name' => $raw->data['name'] ?? '',
                'stock' => $raw->data['stock'] ?? 0,
                'unit' => $raw->data['unit'] ?? '',
                'lowerLimit' => $raw->data['lowerLimit'] ?? 0,
            ];

            return $this->apiResponse(['rawMaterial' => $payload], 'Raw material updated successfully.');
        } catch (\Exception $e) {
            Log::error('Raw material update error: '.$e->getMessage());

            return $this->apiError('Failed to update raw material.', null, 500);
        }
    }

    /**
     * Delete single raw material (soft delete)
     * ID bisa dari URL parameter atau dari body
     */
    public function destroy(Request $request, $id = null)
    {
        try {
            // Prioritaskan ID dari URL, fallback ke body
            $rawMaterialId = $id ?? $request->input('id');

            if (! $rawMaterialId) {
                return $this->apiError('Raw material ID is required.', null, 422);
            }

            $raw = RawMaterial::find($rawMaterialId);

            if (! $raw) {
                return $this->apiError('Raw material not found.', null, 404);
            }

            $raw->delete();

            return $this->apiResponse(null, 'Raw material deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Raw material deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete raw material.', null, 500);
        }
    }

    /**
     * Mass delete raw materials (soft delete)
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

            foreach ($validated['ids'] as $rawMaterialId) {
                $raw = RawMaterial::find($rawMaterialId);

                if ($raw) {
                    $raw->delete();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $rawMaterialId;
                }
            }

            $message = "{$deletedCount} raw material(s) deleted successfully.";
            if (! empty($notFoundIds)) {
                $message .= ' Not found: '.implode(', ', $notFoundIds);
            }

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            Log::error('Mass raw material deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete raw materials.', null, 500);
        }
    }
}
