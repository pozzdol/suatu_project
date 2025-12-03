<?php

namespace App\Http\Controllers;

use App\Models\FinishedGood;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class FinishedGoodsController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $finishedGoods = FinishedGood::with(['workOrder.order', 'product'])
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->get();

            $payload = $finishedGoods->map(function ($item) {
                return [
                    'id' => $item->id,
                    'workOrderId' => $item->work_order_id,
                    'workOrderNoSurat' => $item->workOrder?->no_surat ?? '',
                    'productId' => $item->product_id,
                    'productName' => $item->product->data['name'] ?? '',
                    'quantity' => $item->quantity,
                    'notes' => $item->notes,
                    'producedAt' => $item->produced_at,
                    'deleted' => $item->deleted,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ];
            });

            return $this->apiResponse(['finishedGoods' => $payload], 'Finished goods retrieved successfully.', true, 200);
        } catch (\Exception $e) {
            Log::error('Finished goods retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve finished goods.', null, 500);
        }
    }

    public function create(Request $request)
    {
        $rules = [
            'workOrderId' => 'required|string|exists:work_orders,id',
            'productId' => 'required|string|exists:product,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
            'producedAt' => 'nullable|date',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        try {
            $validated = $validator->validated();

            $finishedGood = new FinishedGood;
            $finishedGood->work_order_id = $validated['workOrderId'];
            $finishedGood->product_id = $validated['productId'];
            $finishedGood->quantity = $validated['quantity'];
            $finishedGood->notes = $validated['notes'] ?? null;
            $finishedGood->produced_at = $validated['producedAt'] ?? now();
            $finishedGood->save();

            $finishedGood->load(['workOrder.order', 'product']);

            $payload = [
                'id' => $finishedGood->id,
                'workOrderId' => $finishedGood->work_order_id,
                'workOrderNoSurat' => $finishedGood->workOrder?->no_surat ?? '',
                'productId' => $finishedGood->product_id,
                'productName' => $finishedGood->product->data['name'] ?? '',
                'quantity' => $finishedGood->quantity,
                'notes' => $finishedGood->notes,
                'producedAt' => $finishedGood->produced_at,
                'deleted' => $finishedGood->deleted,
                'created_at' => $finishedGood->created_at,
                'updated_at' => $finishedGood->updated_at,
            ];

            return $this->apiResponse(['finishedGood' => $payload], 'Finished good created successfully.', true, 201);
        } catch (\Exception $e) {
            Log::error('Finished good creation error: '.$e->getMessage());

            return $this->apiError('Failed to create finished good.', null, 500);
        }
    }

    public function show($id)
    {
        try {
            $finishedGood = FinishedGood::with(['workOrder.order', 'product'])->find($id);

            if (! $finishedGood) {
                return $this->apiError('Finished good not found.', null, 404);
            }

            $payload = [
                'id' => $finishedGood->id,
                'workOrderId' => $finishedGood->work_order_id,
                'workOrderNoSurat' => $finishedGood->workOrder?->no_surat ?? '',
                'productId' => $finishedGood->product_id,
                'productName' => $finishedGood->product->data['name'] ?? '',
                'quantity' => $finishedGood->quantity,
                'notes' => $finishedGood->notes,
                'producedAt' => $finishedGood->produced_at,
                'deleted' => $finishedGood->deleted,
                'created_at' => $finishedGood->created_at,
                'updated_at' => $finishedGood->updated_at,
            ];

            return $this->apiResponse(['finishedGood' => $payload], 'Finished good retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Finished good retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve finished good.', null, 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $finishedGood = FinishedGood::find($id);

            if (! $finishedGood) {
                return $this->apiError('Finished good not found.', null, 404);
            }

            $rules = [
                'workOrderId' => 'sometimes|required|string|exists:work_orders,id',
                'productId' => 'sometimes|required|string|exists:product,id',
                'quantity' => 'sometimes|required|integer|min:1',
                'notes' => 'sometimes|nullable|string|max:1000',
                'producedAt' => 'sometimes|nullable|date',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $validated = $validator->validated();

            if (isset($validated['workOrderId'])) {
                $finishedGood->work_order_id = $validated['workOrderId'];
            }
            if (isset($validated['productId'])) {
                $finishedGood->product_id = $validated['productId'];
            }
            if (isset($validated['quantity'])) {
                $finishedGood->quantity = $validated['quantity'];
            }
            if (array_key_exists('notes', $validated)) {
                $finishedGood->notes = $validated['notes'];
            }
            if (array_key_exists('producedAt', $validated)) {
                $finishedGood->produced_at = $validated['producedAt'];
            }

            $finishedGood->save();
            $finishedGood->load(['workOrder.order', 'product']);

            $payload = [
                'id' => $finishedGood->id,
                'workOrderId' => $finishedGood->work_order_id,
                'workOrderNoSurat' => $finishedGood->workOrder?->no_surat ?? '',
                'productId' => $finishedGood->product_id,
                'productName' => $finishedGood->product->data['name'] ?? '',
                'quantity' => $finishedGood->quantity,
                'notes' => $finishedGood->notes,
                'producedAt' => $finishedGood->produced_at,
                'deleted' => $finishedGood->deleted,
                'created_at' => $finishedGood->created_at,
                'updated_at' => $finishedGood->updated_at,
            ];

            return $this->apiResponse(['finishedGood' => $payload], 'Finished good updated successfully.');
        } catch (\Exception $e) {
            Log::error('Finished good update error: '.$e->getMessage());

            return $this->apiError('Failed to update finished good.', null, 500);
        }
    }

    /**
     * Delete single finished good (soft delete)
     */
    public function destroy(Request $request, $id = null)
    {
        try {
            $finishedGoodId = $id ?? $request->input('id');

            if (! $finishedGoodId) {
                return $this->apiError('Finished good ID is required.', null, 422);
            }

            $finishedGood = FinishedGood::find($finishedGoodId);

            if (! $finishedGood) {
                return $this->apiError('Finished good not found.', null, 404);
            }

            $finishedGood->forceDelete();

            return $this->apiResponse(null, 'Finished good deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Finished good deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete finished good.', null, 500);
        }
    }

    /**
     * Mass delete finished goods (soft delete)
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

            foreach ($validated['ids'] as $finishedGoodId) {
                $finishedGood = FinishedGood::find($finishedGoodId);

                if ($finishedGood) {
                    $finishedGood->delete();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $finishedGoodId;
                }
            }

            $message = "{$deletedCount} finished good(s) deleted successfully.";
            if (! empty($notFoundIds)) {
                $message .= ' Not found: '.implode(', ', $notFoundIds);
            }

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            Log::error('Mass finished good deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete finished goods.', null, 500);
        }
    }

    /**
     * Get finished goods by work order ID
     */
    public function byWorkOrder($workOrderId)
    {
        try {
            $finishedGoods = FinishedGood::with(['workOrder.order', 'product'])
                ->where('work_order_id', $workOrderId)
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->get();

            $payload = $finishedGoods->map(function ($item) {
                return [
                    'id' => $item->id,
                    'workOrderId' => $item->work_order_id,
                    'workOrderNoSurat' => $item->workOrder?->no_surat ?? '',
                    'productId' => $item->product_id,
                    'productName' => $item->product->data['name'] ?? '',
                    'quantity' => $item->quantity,
                    'notes' => $item->notes,
                    'producedAt' => $item->produced_at,
                    'deleted' => $item->deleted,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ];
            });

            return $this->apiResponse(['finishedGoods' => $payload], 'Finished goods retrieved successfully.', true, 200);
        } catch (\Exception $e) {
            Log::error('Finished goods by work order retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve finished goods.', null, 500);
        }
    }
}
