<?php

namespace App\Http\Controllers;

use App\Models\RawMaterial;
use App\Models\RawMaterialUsage;
use App\Services\LowStockNotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RawMaterialUsageController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $usages = RawMaterialUsage::with(['order', 'orderItem', 'product', 'rawMaterial', 'workOrder'])
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->get();

            $payload = $usages->map(function ($usage) {
                return $this->transformRawMaterialUsage($usage);
            });

            return $this->apiResponse(['rawMaterialUsages' => $payload], 'Raw material usages retrieved successfully.', true, 200);
        } catch (\Exception $e) {
            Log::error('Raw material usage retrieval error: ' . $e->getMessage());

            return $this->apiError('Failed to retrieve raw material usages.', null, 500);
        }
    }

    public function create(Request $request)
    {
        $rules = [
            'order_id' => 'nullable|string|exists:orders,id',
            'order_item_id' => 'nullable|string|exists:order_item,id',
            'product_id' => 'nullable|string|exists:product,id',
            'raw_material_id' => 'required|string|exists:raw_material,id',
            'quantity_used' => 'required|numeric|min:0.01',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        DB::beginTransaction();

        try {
            $validated = $validator->validated();

            // Check raw material availability
            $rawMaterial = RawMaterial::find($validated['raw_material_id']);

            if (! $rawMaterial) {
                return $this->apiError('Raw material not found.', null, 404);
            }

            $currentStock = $rawMaterial->data['stock'] ?? 0;

            if ($currentStock < $validated['quantity_used']) {
                return $this->apiError(
                    'Insufficient raw material stock.',
                    [
                        'available' => $currentStock,
                        'required' => $validated['quantity_used'],
                        'shortage' => $validated['quantity_used'] - $currentStock,
                    ],
                    422
                );
            }

            // Deduct raw material stock
            $data = $rawMaterial->data ?? [];
            $data['stock'] = max(0, $currentStock - $validated['quantity_used']);
            $rawMaterial->data = $data;
            $rawMaterial->save();

            // Create usage record
            $usage = RawMaterialUsage::create([
                'order_id' => $validated['order_id'] ?? null,
                'order_item_id' => $validated['order_item_id'] ?? null,
                'product_id' => $validated['product_id'] ?? null,
                'raw_material_id' => $validated['raw_material_id'],
                'quantity_used' => $validated['quantity_used'],
            ]);

            $usage->load(['order', 'orderItem', 'product', 'rawMaterial', 'workOrder']);

            $payload = $this->transformRawMaterialUsage($usage);

            DB::commit();

            return $this->apiResponse(['rawMaterialUsage' => $payload], 'Raw material usage created successfully.', true, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Raw material usage creation error: ' . $e->getMessage());

            return $this->apiError('Failed to create raw material usage.', null, 500);
        }
    }

    public function show($id)
    {
        try {
            $usage = RawMaterialUsage::with(['order', 'orderItem', 'product', 'rawMaterial', 'workOrder'])->find($id);

            if (! $usage) {
                return $this->apiError('Raw material usage not found.', null, 404);
            }

            $payload = $this->transformRawMaterialUsage($usage);

            return $this->apiResponse(['rawMaterialUsage' => $payload], 'Raw material usage retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Raw material usage retrieval error: ' . $e->getMessage());

            return $this->apiError('Failed to retrieve raw material usage.', null, 500);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $usage = RawMaterialUsage::find($id);

            if (! $usage) {
                return $this->apiError('Raw material usage not found.', null, 404);
            }

            $rules = [
                'order_id' => 'nullable|string|exists:orders,id',
                'order_item_id' => 'nullable|string|exists:order_item,id',
                'product_id' => 'nullable|string|exists:product,id',
                'raw_material_id' => 'sometimes|required|string|exists:raw_material,id',
                'quantity_used' => 'sometimes|required|numeric|min:0.01',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $validated = $validator->validated();

            // Revert original usage first
            $originalRawMaterial = RawMaterial::find($usage->raw_material_id);
            if ($originalRawMaterial) {
                $data = $originalRawMaterial->data ?? [];
                $currentStock = $data['stock'] ?? 0;
                $data['stock'] = $currentStock + (float) $usage->quantity_used;
                $originalRawMaterial->data = $data;
                $originalRawMaterial->save();
            }

            // Apply new usage
            $newRawMaterialId = $validated['raw_material_id'] ?? $usage->raw_material_id;
            $newQuantity = $validated['quantity_used'] ?? $usage->quantity_used;

            $newRawMaterial = RawMaterial::find($newRawMaterialId);

            if (! $newRawMaterial) {
                DB::rollBack();

                return $this->apiError('Raw material not found.', null, 404);
            }

            $currentStock = $newRawMaterial->data['stock'] ?? 0;

            if ($currentStock < $newQuantity) {
                DB::rollBack();

                return $this->apiError(
                    'Insufficient raw material stock.',
                    [
                        'available' => $currentStock,
                        'required' => $newQuantity,
                        'shortage' => $newQuantity - $currentStock,
                    ],
                    422
                );
            }

            // Deduct new stock
            $data = $newRawMaterial->data ?? [];
            $data['stock'] = max(0, $currentStock - $newQuantity);
            $newRawMaterial->data = $data;
            $newRawMaterial->save();

            // Update usage record
            $usage->order_id = $validated['order_id'] ?? $usage->order_id;
            $usage->order_item_id = $validated['order_item_id'] ?? $usage->order_item_id;
            $usage->product_id = $validated['product_id'] ?? $usage->product_id;
            $usage->raw_material_id = $newRawMaterialId;
            $usage->quantity_used = $newQuantity;
            $usage->save();

            $usage->load(['order', 'orderItem', 'product', 'rawMaterial', 'workOrder']);

            $payload = $this->transformRawMaterialUsage($usage);

            DB::commit();

            return $this->apiResponse(['rawMaterialUsage' => $payload], 'Raw material usage updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Raw material usage update error: ' . $e->getMessage());

            return $this->apiError('Failed to update raw material usage.', null, 500);
        }
    }

    public function destroy(Request $request, $id = null)
    {
        DB::beginTransaction();

        try {
            $usageId = $id ?? $request->input('id');

            if (! $usageId) {
                return $this->apiError('Raw material usage ID is required.', null, 422);
            }

            $usage = RawMaterialUsage::find($usageId);

            if (! $usage) {
                return $this->apiError('Raw material usage not found.', null, 404);
            }

            // Revert raw material stock
            $rawMaterial = RawMaterial::find($usage->raw_material_id);

            if ($rawMaterial) {
                $data = $rawMaterial->data ?? [];
                $currentStock = $data['stock'] ?? 0;
                $data['stock'] = $currentStock + (float) $usage->quantity_used;
                $rawMaterial->data = $data;
                $rawMaterial->save();
            }

            $usage->delete();

            DB::commit();

            return $this->apiResponse(null, 'Raw material usage deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Raw material usage deletion error: ' . $e->getMessage());

            return $this->apiError('Failed to delete raw material usage.', null, 500);
        }
    }

    public function massDestroy(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required|string',
        ])->validate();

        DB::beginTransaction();

        try {
            $deletedCount = 0;
            $notFoundIds = [];

            foreach ($validated['ids'] as $usageId) {
                $usage = RawMaterialUsage::find($usageId);

                if ($usage) {
                    // Revert raw material stock
                    $rawMaterial = RawMaterial::find($usage->raw_material_id);

                    if ($rawMaterial) {
                        $data = $rawMaterial->data ?? [];
                        $currentStock = $data['stock'] ?? 0;
                        $data['stock'] = $currentStock + (float) $usage->quantity_used;
                        $rawMaterial->data = $data;
                        $rawMaterial->save();
                    }

                    $usage->delete();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $usageId;
                }
            }

            $message = "{$deletedCount} raw material usage(s) deleted successfully.";
            if (! empty($notFoundIds)) {
                $message .= ' Not found: ' . implode(', ', $notFoundIds);
            }

            DB::commit();

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Mass raw material usage deletion error: ' . $e->getMessage());

            return $this->apiError('Failed to delete raw material usages.', null, 500);
        }
    }

    /**
     * Transform raw material usage for response
     */
    private function transformRawMaterialUsage($usage): array
    {
        return [
            'id' => $usage->id,
            'orderId' => $usage->order_id,
            'nameOrder' => $usage->order ? $usage->order->name : '',
            'orderItemId' => $usage->order_item_id,
            'productId' => $usage->product_id,
            'productName' => $usage->product?->data['name'] ?? '',
            'rawMaterialId' => $usage->raw_material_id,
            'rawMaterialName' => $usage->rawMaterial?->data['name'] ?? '',
            'quantityUsed' => $usage->quantity_used,
            'unit' => $usage->rawMaterial?->data['unit'] ?? '',
            'workOrder' => $usage->workOrder ? [
                'id' => $usage->workOrder->id,
                'workOrderNumber' => $usage->workOrder->no_surat,
                'status' => $usage->workOrder->status,
            ] : null,
            'deleted' => $usage->deleted,
            'created_at' => $usage->workOrder->created_at ?? $usage->created_at,
            'updated_at' => $usage->updated_at,
        ];
    }
}
