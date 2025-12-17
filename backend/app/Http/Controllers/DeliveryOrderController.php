<?php

namespace App\Http\Controllers;

use App\Models\DeliveryOrder;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DeliveryOrderController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $deliveryOrders = DeliveryOrder::with(['order', 'items'])
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->get();

            $payload = $deliveryOrders->map(function ($item) {
                return $this->transformDeliveryOrder($item);
            });

            return $this->apiResponse(['deliveryOrders' => $payload], 'Delivery orders retrieved successfully.', true, 200);
        } catch (\Exception $e) {
            Log::error('Delivery orders retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve delivery orders.', null, 500);
        }
    }

    public function create(Request $request)
    {
        $rules = [
            'orderId' => 'required|string|exists:orders,id',
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|in:pending,shipped,delivered,cancelled',
            'shippedAt' => 'nullable|date',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        try {
            $validated = $validator->validated();

            $deliveryOrder = new DeliveryOrder;
            $deliveryOrder->order_id = $validated['orderId'];
            $deliveryOrder->description = $validated['description'] ?? null;
            $deliveryOrder->status = $validated['status'] ?? 'pending';
            $deliveryOrder->shipped_at = $validated['shippedAt'] ?? null;
            $deliveryOrder->delivered_at = $validated['deliveredAt'] ?? null;
            $deliveryOrder->save();

            $deliveryOrder->load(['order.orderItems.product']);

            $payload = $this->transformDeliveryOrder($deliveryOrder);

            return $this->apiResponse(['deliveryOrder' => $payload], 'Delivery order created successfully.', true, 201);
        } catch (\Exception $e) {
            Log::error('Delivery order creation error: '.$e->getMessage());

            return $this->apiError('Failed to create delivery order.', null, 500);
        }
    }

    public function show($id)
    {
        try {
            $deliveryOrder = DeliveryOrder::with(['order', 'items'])->find($id);

            if (! $deliveryOrder) {
                return $this->apiError('Delivery order not found.', null, 404);
            }

            $payload = $this->transformDeliveryOrder($deliveryOrder);

            return $this->apiResponse(['deliveryOrder' => $payload], 'Delivery order retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Delivery order retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve delivery order.', null, 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $deliveryOrder = DeliveryOrder::find($id);

            if (! $deliveryOrder) {
                return $this->apiError('Delivery order not found.', null, 404);
            }

            $rules = [
                'orderId' => 'sometimes|required|string|exists:orders,id',
                'description' => 'sometimes|nullable|string|max:1000',
                'status' => 'sometimes|nullable|in:pending,shipped,delivered,cancelled',
                'shippedAt' => 'sometimes|nullable|date',
                'deliveredAt' => 'sometimes|nullable|date',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $validated = $validator->validated();

            if (isset($validated['orderId'])) {
                $deliveryOrder->order_id = $validated['orderId'];
            }
            if (array_key_exists('description', $validated)) {
                $deliveryOrder->description = $validated['description'];
            }
            if (array_key_exists('status', $validated)) {
                $deliveryOrder->status = $validated['status'];
            }
            if (array_key_exists('shippedAt', $validated)) {
                $deliveryOrder->shipped_at = $validated['shippedAt'];
            }
            if (array_key_exists('deliveredAt', $validated)) {
                $deliveryOrder->delivered_at = $validated['deliveredAt'];
            }

            $deliveryOrder->save();
            $deliveryOrder->load(['order.orderItems.product']);

            $payload = $this->transformDeliveryOrder($deliveryOrder);

            return $this->apiResponse(['deliveryOrder' => $payload], 'Delivery order updated successfully.');
        } catch (\Exception $e) {
            Log::error('Delivery order update error: '.$e->getMessage());

            return $this->apiError('Failed to update delivery order.', null, 500);
        }
    }

    /**
     * Update delivery order status
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $deliveryOrder = DeliveryOrder::find($id);

            if (! $deliveryOrder) {
                return $this->apiError('Delivery order not found.', null, 404);
            }

            $rules = [
                'status' => 'required|in:pending,shipped,delivered,cancelled',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $validated = $validator->validated();
            $newStatus = $validated['status'];
            $deliveryOrder->status = $newStatus;

            // Auto-set/clear timestamps based on status
            if ($newStatus === 'shipped') {
                $deliveryOrder->shipped_at = now();
                $deliveryOrder->delivered_at = null; // Clear delivered timestamp
            } elseif ($newStatus === 'delivered') {
                // Set shipped_at jika belum ada
                if (! $deliveryOrder->shipped_at) {
                    $deliveryOrder->shipped_at = now();
                }
                $deliveryOrder->delivered_at = now();
            } elseif ($newStatus === 'pending') {
                $deliveryOrder->shipped_at = null;
                $deliveryOrder->delivered_at = null;
            } elseif ($newStatus === 'cancelled') {
                // Keep timestamps as historical record, or clear if needed
                // $deliveryOrder->shipped_at = null;
                // $deliveryOrder->delivered_at = null;
            }

            $deliveryOrder->save();
            $deliveryOrder->load(['order.orderItems.product']);

            $payload = $this->transformDeliveryOrder($deliveryOrder);

            return $this->apiResponse(['deliveryOrder' => $payload], 'Delivery order status updated successfully.');
        } catch (\Exception $e) {
            Log::error('Delivery order status update error: '.$e->getMessage());

            return $this->apiError('Failed to update delivery order status.', null, 500);
        }
    }

    /**
     * Mark delivery order as delivered
     */
    public function markDelivered(Request $request, $id)
    {
        try {
            $deliveryOrder = DeliveryOrder::find($id);

            if (! $deliveryOrder) {
                return $this->apiError('Delivery order not found.', null, 404);
            }

            $rules = [
                'deliveredAt' => 'nullable|date',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $validated = $validator->validated();

            $deliveryOrder->status = 'delivered';
            $deliveryOrder->delivered_at = $validated['deliveredAt'] ?? now();

            // Auto-set shipped_at jika belum ada
            if (! $deliveryOrder->shipped_at) {
                $deliveryOrder->shipped_at = $deliveryOrder->delivered_at;
            }

            $deliveryOrder->save();
            $deliveryOrder->load(['order.orderItems.product']);

            $payload = $this->transformDeliveryOrder($deliveryOrder);

            return $this->apiResponse(['deliveryOrder' => $payload], 'Delivery order marked as delivered successfully.');
        } catch (\Exception $e) {
            Log::error('Mark delivery order as delivered error: '.$e->getMessage());

            return $this->apiError('Failed to mark delivery order as delivered.', null, 500);
        }
    }

    /**
     * Delete single delivery order (soft delete)
     */
    public function destroy(Request $request, $id = null)
    {
        try {
            $deliveryOrderId = $id ?? $request->input('id');

            if (! $deliveryOrderId) {
                return $this->apiError('Delivery order ID is required.', null, 422);
            }

            $deliveryOrder = DeliveryOrder::find($deliveryOrderId);

            if (! $deliveryOrder) {
                return $this->apiError('Delivery order not found.', null, 404);
            }

            $deliveryOrder->forceDelete();

            return $this->apiResponse(null, 'Delivery order deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Delivery order deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete delivery order.', null, 500);
        }
    }

    /**
     * Mass delete delivery orders (soft delete)
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

            foreach ($validated['ids'] as $deliveryOrderId) {
                $deliveryOrder = DeliveryOrder::find($deliveryOrderId);

                if ($deliveryOrder) {
                    $deliveryOrder->delete();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $deliveryOrderId;
                }
            }

            $message = "{$deletedCount} delivery order(s) deleted successfully.";
            if (! empty($notFoundIds)) {
                $message .= ' Not found: '.implode(', ', $notFoundIds);
            }

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            Log::error('Mass delivery order deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete delivery orders.', null, 500);
        }
    }

    /**
     * Get delivery orders by order ID
     */
    public function byOrder($orderId)
    {
        try {
            $deliveryOrders = DeliveryOrder::with(['order', 'items'])
                ->where('order_id', $orderId)
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->get();

            $payload = $deliveryOrders->map(function ($item) {
                return $this->transformDeliveryOrder($item);
            });

            return $this->apiResponse(['deliveryOrders' => $payload], 'Delivery orders retrieved successfully.', true, 200);
        } catch (\Exception $e) {
            Log::error('Delivery orders by order retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve delivery orders.', null, 500);
        }
    }

    /**
     * Transform delivery order for response
     */
    private function transformDeliveryOrder(DeliveryOrder $deliveryOrder): array
    {
        // Transform delivery order items (actual items being delivered)
        $deliveryItems = [];
        if ($deliveryOrder->items) {
            $deliveryItems = $deliveryOrder->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'productId' => $item->product_id,
                    'productName' => $item->product_name,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                ];
            })->toArray();
        }

        return [
            'id' => $deliveryOrder->id,
            'orderId' => $deliveryOrder->order_id,
            'workOrderId' => $deliveryOrder->work_order_id,
            'orderCode' => $deliveryOrder->order_code,
            'noSurat' => $deliveryOrder->no_surat,
            'description' => $deliveryOrder->description,
            'recipientName' => $deliveryOrder->order?->name ?? null,
            'recipientPhone' => $deliveryOrder->order?->phone ?? null,
            'address' => $deliveryOrder->order?->address ?? null,
            'status' => $deliveryOrder->status,
            'shippedAt' => $deliveryOrder->shipped_at,
            'deliveredAt' => $deliveryOrder->delivered_at,
            'plannedDeliveryDate' => $deliveryOrder->planned_delivery_date,
            'order' => $deliveryOrder->order ? [
                'id' => $deliveryOrder->order->id,
                'name' => $deliveryOrder->order->name,
                'email' => $deliveryOrder->order->email,
                'phone' => $deliveryOrder->order->phone,
                'address' => $deliveryOrder->order->address,
                'status' => $deliveryOrder->order->status,
            ] : null,
            'items' => $deliveryItems,
            'totalItems' => count($deliveryItems),
            'totalQuantity' => array_sum(array_column($deliveryItems, 'quantity')),
            'deleted' => $deliveryOrder->deleted,
            'createdAt' => $deliveryOrder->created_at,
            'updatedAt' => $deliveryOrder->updated_at,
        ];
    }
}
