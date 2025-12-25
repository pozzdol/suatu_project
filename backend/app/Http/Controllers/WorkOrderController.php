<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\WorkOrder;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WorkOrderController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $workOrders = WorkOrder::with(['order.orderItems.product', 'deliveryOrders.items'])
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->get();

            $payload = $workOrders->map(function ($workOrder) {
                return [
                    'id' => $workOrder->id,
                    'orderId' => $workOrder->order_id,
                    'orderName' => $workOrder->order?->name ?? '',
                    'orderPo' => $workOrder->order?->nopo ?? '',
                    'noSurat' => $workOrder->no_surat,
                    'description' => $workOrder->description,
                    'status' => $workOrder->status,
                    'orderItems' => $workOrder->order?->orderItems->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'productId' => $item->product_id,
                            'productName' => $item->product->data['name'] ?? '',
                            'quantity' => $item->quantity,
                        ];
                    }) ?? [],
                    'deliveryOrders' => $workOrder->deliveryOrders->map(function ($delivery) {
                        return [
                            'id' => $delivery->id,
                            'orderCode' => $delivery->order_code,
                            'plannedDeliveryDate' => $delivery->planned_delivery_date,
                            'status' => $delivery->status,
                            'items' => $delivery->items->map(function ($item) {
                                return [
                                    'id' => $item->id,
                                    'productId' => $item->product_id,
                                    'productName' => $item->product_name,
                                    'quantity' => $item->quantity,
                                    'unit' => $item->unit,
                                ];
                            }),
                            'shippedAt' => $delivery->shipped_at,
                            'createdAt' => $delivery->created_at,
                        ];
                    }) ?? [],
                    'deleted' => $workOrder->deleted,
                    'confirmed_at' => $workOrder->order?->date_confirm,
                    'created_at' => $workOrder->created_at,
                    'updated_at' => $workOrder->updated_at,
                ];
            });

            return $this->apiResponse(['workOrders' => $payload], 'Work orders retrieved successfully.', true, 200);
        } catch (\Exception $e) {
            Log::error('Work order retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve work orders.', null, 500);
        }
    }

    public function show($id)
    {
        try {
            $workOrder = WorkOrder::with(['order.orderItems.product', 'deliveryOrders.items'])->find($id);

            // return $workOrder;

            if (! $workOrder) {
                return $this->apiError('Work order not found.', null, 404);
            }

            $payload = [
                'id' => $workOrder->id,
                'orderId' => $workOrder->order_id,
                'orderName' => $workOrder->order?->name ?? '',
                'orderPo' => $workOrder->order?->nopo ?? '',
                'noSurat' => $workOrder->no_surat,
                'description' => $workOrder->description,
                'status' => $workOrder->status,
                'project' => $workOrder->order?->project ?? '',
                'statusOrder' => $workOrder->order?->status ?? '',
                'finishing' => $workOrder->order?->finishing ?? '',
                'thickness' => $workOrder->order?->thickness ?? '',
                'note' => $workOrder->order?->note ?? '',
                'orderItems' => $workOrder->order?->orderItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'productId' => $item->product_id,
                        'productName' => $item->product->data['name'] ?? '',
                        'quantity' => $item->quantity,
                        'remark' => $item->remark ?? '',
                    ];
                }) ?? [],
                'deliveryOrders' => $workOrder->deliveryOrders->map(function ($delivery) {
                    return [
                        'id' => $delivery->id,
                        'orderCode' => $delivery->order_code,
                        'plannedDeliveryDate' => $delivery->planned_delivery_date,
                        'status' => $delivery->status,
                        'items' => $delivery->items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'productId' => $item->product_id,
                                'productName' => $item->product_name,
                                'quantity' => $item->quantity,
                                'unit' => $item->unit,
                            ];
                        }),
                        'shippedAt' => $delivery->shipped_at,
                        'createdAt' => $delivery->created_at,
                    ];
                }) ?? [],
                'deleted' => $workOrder->deleted,
                'created_at' => $workOrder->created_at,
                'updated_at' => $workOrder->updated_at,
            ];

            return $this->apiResponse(['workOrder' => $payload], 'Work order retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Work order retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve work order.', null, 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $workOrder = WorkOrder::with(['order.orderItems.product', 'deliveryOrders.items'])->find($id);

            if (! $workOrder) {
                return $this->apiError('Work order not found.', null, 404);
            }

            $rules = [
                'description' => 'sometimes|nullable|string|max:1000',
                'status' => 'sometimes|required|string|in:pending,in_progress,completed,cancelled',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $validated = $validator->validated();

            if (isset($validated['description'])) {
                $workOrder->description = $validated['description'];
            }
            if (isset($validated['status'])) {
                $workOrder->status = $validated['status'];
            }

            $workOrder->save();

            $payload = [
                'id' => $workOrder->id,
                'orderId' => $workOrder->order_id,
                'orderName' => $workOrder->order?->name ?? '',
                'noSurat' => $workOrder->no_surat,
                'description' => $workOrder->description,
                'status' => $workOrder->status,
                'orderItems' => $workOrder->order?->orderItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'productId' => $item->product_id,
                        'productName' => $item->product->data['name'] ?? '',
                        'quantity' => $item->quantity,
                    ];
                }) ?? [],
                'deliveryOrders' => $workOrder->deliveryOrders->map(function ($delivery) {
                    return [
                        'id' => $delivery->id,
                        'orderCode' => $delivery->order_code,
                        'plannedDeliveryDate' => $delivery->planned_delivery_date,
                        'status' => $delivery->status,
                        'items' => $delivery->items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'productId' => $item->product_id,
                                'productName' => $item->product_name,
                                'quantity' => $item->quantity,
                                'unit' => $item->unit,
                            ];
                        }),
                        'shippedAt' => $delivery->shipped_at,
                        'createdAt' => $delivery->created_at,
                    ];
                }) ?? [],
                'deleted' => $workOrder->deleted,
                'created_at' => $workOrder->created_at,
                'updated_at' => $workOrder->updated_at,
            ];

            return $this->apiResponse(['workOrder' => $payload], 'Work order updated successfully.');
        } catch (\Exception $e) {
            Log::error('Work order update error: '.$e->getMessage());

            return $this->apiError('Failed to update work order.', null, 500);
        }
    }

    /**
     * Delete single work order (soft delete)
     * ID bisa dari URL parameter atau dari body
     */
    public function destroy(Request $request, $id = null)
    {
        try {
            $workOrderId = $id ?? $request->input('id');

            if (! $workOrderId) {
                return $this->apiError('Work order ID is required.', null, 422);
            }

            $workOrder = WorkOrder::find($workOrderId);

            if (! $workOrder) {
                return $this->apiError('Work order not found.', null, 404);
            }

            $workOrder->delete();

            return $this->apiResponse(null, 'Work order deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Work order deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete work order.', null, 500);
        }
    }

    /**
     * Mass delete work orders (soft delete)
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

            foreach ($validated['ids'] as $workOrderId) {
                $workOrder = WorkOrder::find($workOrderId);

                if ($workOrder) {
                    $workOrder->delete();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $workOrderId;
                }
            }

            $message = "{$deletedCount} work order(s) deleted successfully.";
            if (! empty($notFoundIds)) {
                $message .= ' Not found: '.implode(', ', $notFoundIds);
            }

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            Log::error('Mass work order deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete work orders.', null, 500);
        }
    }

    /**
     * Update work order status only
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $workOrder = WorkOrder::with(['order.orderItems.product', 'deliveryOrders.items'])->find($id);

            if (! $workOrder) {
                return $this->apiError('Work order not found.', null, 404);
            }

            $rules = [
                'status' => 'required|string|in:pending,in_progress,completed,cancelled',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $validated = $validator->validated();
            $workOrder->status = $validated['status'];
            $workOrder->save();

            $payload = [
                'id' => $workOrder->id,
                'orderId' => $workOrder->order_id,
                'orderName' => $workOrder->order?->name ?? '',
                'noSurat' => $workOrder->no_surat,
                'description' => $workOrder->description,
                'status' => $workOrder->status,
                'orderItems' => $workOrder->order?->orderItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'productId' => $item->product_id,
                        'productName' => $item->product->data['name'] ?? '',
                        'quantity' => $item->quantity,
                    ];
                }) ?? [],
                'deliveryOrders' => $workOrder->deliveryOrders->map(function ($delivery) {
                    return [
                        'id' => $delivery->id,
                        'orderCode' => $delivery->order_code,
                        'plannedDeliveryDate' => $delivery->planned_delivery_date,
                        'status' => $delivery->status,
                        'items' => $delivery->items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'productId' => $item->product_id,
                                'productName' => $item->product_name,
                                'quantity' => $item->quantity,
                                'unit' => $item->unit,
                            ];
                        }),
                        'shippedAt' => $delivery->shipped_at,
                        'createdAt' => $delivery->created_at,
                    ];
                }) ?? [],
                'deleted' => $workOrder->deleted,
                'created_at' => $workOrder->created_at,
                'updated_at' => $workOrder->updated_at,
            ];

            return $this->apiResponse(['workOrder' => $payload], 'Work order status updated successfully.');
        } catch (\Exception $e) {
            Log::error('Work order status update error: '.$e->getMessage());

            return $this->apiError('Failed to update work order status.', null, 500);
        }
    }
}
