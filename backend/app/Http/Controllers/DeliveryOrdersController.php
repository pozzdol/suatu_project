<?php

namespace App\Http\Controllers;

use App\Models\DeliveryOrder;
use App\Models\DeliveryOrderItem;
use App\Models\Product;
use App\Models\WorkOrder;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DeliveryOrdersController extends Controller
{
    use ApiResponse;

    /**
     * Create a new delivery order
     */
    public function create(Request $request)
    {
        $rules = [
            'workOrderId' => 'required|string|exists:work_orders,id',
            'orderId' => 'required|string|exists:orders,id',
            'description' => 'nullable|string|max:5000',
            'plannedDeliveryDate' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.productId' => 'required|string|exists:product,id',
            'items.*.quantity' => 'required|integer|min:1',
        ];

        \Log::info('=== START CREATE DELIVERY ORDER ===');
        \Log::info('Request data:', $request->all());

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            \Log::error('Validation failed:', $validator->errors()->toArray());

            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        DB::beginTransaction();

        try {
            $validated = $validator->validated();

            // Get work order with order items
            $workOrder = WorkOrder::with(['order.orderItems.product'])->find($validated['workOrderId']);

            if (! $workOrder) {
                \Log::error('Work order not found:', ['workOrderId' => $validated['workOrderId']]);

                return $this->apiError('Work order not found.', null, 404);
            }

            \Log::info('Work order found:', [
                'id' => $workOrder->id,
                'status' => $workOrder->status,
                'order_items_count' => $workOrder->order->orderItems->count(),
            ]);

            // Calculate delivered quantities per product
            $deliveredQuantities = $this->calculateDeliveredQuantities($validated['workOrderId']);
            \Log::info('Delivered quantities:', $deliveredQuantities);

            // Validate new delivery quantities
            $workOrderItems = $workOrder->order->orderItems;
            $validationErrors = [];

            foreach ($validated['items'] as $newItem) {
                $workOrderItem = $workOrderItems->firstWhere('product_id', $newItem['productId']);

                if (! $workOrderItem) {
                    $validationErrors[] = [
                        'productId' => $newItem['productId'],
                        'error' => 'Product not found in work order',
                    ];

                    continue;
                }

                $alreadyDelivered = $deliveredQuantities[$newItem['productId']] ?? 0;
                $remaining = $workOrderItem->quantity - $alreadyDelivered;

                if ($newItem['quantity'] > $remaining) {
                    $productName = $workOrderItem->product->data['name'] ?? 'Unknown';
                    $validationErrors[] = [
                        'productId' => $newItem['productId'],
                        'productName' => $productName,
                        'error' => "Cannot deliver {$newItem['quantity']} units. Only {$remaining} remaining ({$alreadyDelivered} already delivered)",
                        'requested' => $newItem['quantity'],
                        'remaining' => $remaining,
                        'alreadyDelivered' => $alreadyDelivered,
                    ];
                }
            }

            if (! empty($validationErrors)) {
                DB::rollBack();

                return $this->apiError('Validation error.', ['errors' => $validationErrors], 422);
            }

            // Create delivery order
            \Log::info('Creating delivery order...');
            $deliveryOrder = DeliveryOrder::create([
                'work_order_id' => $validated['workOrderId'],
                'order_id' => $validated['orderId'],
                'description' => $validated['description'] ?? null,
                'planned_delivery_date' => $validated['plannedDeliveryDate'] ?? null,
                'status' => 'pending',
            ]);

            \Log::info('Delivery order created:', [
                'id' => $deliveryOrder->id,
                'order_code' => $deliveryOrder->order_code,
            ]);

            // Create delivery order items
            foreach ($validated['items'] as $item) {
                $workOrderItem = $workOrderItems->firstWhere('product_id', $item['productId']);
                $product = $workOrderItem->product;

                $createdItem = DeliveryOrderItem::create([
                    'delivery_order_id' => $deliveryOrder->id,
                    'product_id' => $item['productId'],
                    'product_name' => $product->data['name'] ?? 'Unknown',
                    'quantity' => $item['quantity'],
                    'unit' => $product->data['unit'] ?? null,
                ]);

                \Log::info('Delivery order item created:', [
                    'id' => $createdItem->id,
                    'product_name' => $createdItem->product_name,
                    'quantity' => $createdItem->quantity,
                ]);
            }

            // Load items for response
            $deliveryOrder->load('items');

            // Check if all items have been delivered and auto-complete work order
            $this->checkAndCompleteWorkOrder($workOrder);

            $payload = $this->transformDeliveryOrder($deliveryOrder);

            DB::commit();

            \Log::info('=== DELIVERY ORDER CREATED SUCCESSFULLY ===', ['order_code' => $deliveryOrder->order_code]);

            return $this->apiResponse(['deliveryOrder' => $payload], 'Delivery order created successfully.', true, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delivery order creation error: '.$e->getMessage());

            return $this->apiError('Failed to create delivery order.', null, 500);
        }
    }

    /**
     * Get all delivery orders by work order ID
     */
    public function getByWorkOrder($workOrderId)
    {
        try {
            $workOrder = WorkOrder::find($workOrderId);

            if (! $workOrder) {
                return $this->apiError('Work order not found.', null, 404);
            }

            $deliveryOrders = DeliveryOrder::with('items')
                ->where('work_order_id', $workOrderId)
                ->orderBy('created_at', 'desc')
                ->get();

            $payload = $deliveryOrders->map(function ($deliveryOrder) {
                return $this->transformDeliveryOrder($deliveryOrder);
            });

            return $this->apiResponse(['deliveryOrders' => $payload], 'Delivery orders retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Delivery order retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve delivery orders.', null, 500);
        }
    }

    /**
     * Get product delivery summary for a work order
     */
    public function getDeliverySummary($workOrderId)
    {
        try {
            $workOrder = WorkOrder::with(['order.orderItems.product', 'deliveryOrders.items'])
                ->find($workOrderId);

            if (! $workOrder) {
                return $this->apiError('Work order not found.', null, 404);
            }

            $orderItems = $workOrder->order->orderItems;
            $deliveryOrders = $workOrder->deliveryOrders;

            $summary = $orderItems->map(function ($orderItem) use ($deliveryOrders) {
                $delivered = $deliveryOrders->reduce(function ($sum, $delivery) use ($orderItem) {
                    $deliveryItem = $delivery->items->firstWhere('product_id', $orderItem->product_id);

                    return $sum + ($deliveryItem->quantity ?? 0);
                }, 0);

                $product = $orderItem->product;

                return [
                    'productId' => $orderItem->product_id,
                    'productName' => $product->data['name'] ?? 'Unknown',
                    'orderedQuantity' => $orderItem->quantity,
                    'deliveredQuantity' => $delivered,
                    'remainingQuantity' => $orderItem->quantity - $delivered,
                    'unit' => $product->data['unit'] ?? null,
                ];
            });

            return $this->apiResponse(['summary' => $summary], 'Delivery summary retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Delivery summary error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve delivery summary.', null, 500);
        }
    }

    /**
     * Delete a delivery order
     */
    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            $deliveryOrder = DeliveryOrder::find($id);

            if (! $deliveryOrder) {
                return $this->apiError('Delivery order not found.', null, 404);
            }

            if ($deliveryOrder->status !== 'pending') {
                return $this->apiError('Only pending delivery orders can be deleted.', null, 422);
            }

            $workOrder = WorkOrder::find($deliveryOrder->work_order_id);

            $deliveryOrder->delete();

            // Revert work order status if it was completed but now items are incomplete
            if ($workOrder) {
                $this->checkAndRevertWorkOrder($workOrder);
            }

            DB::commit();

            return $this->apiResponse(null, 'Delivery order deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delivery order deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete delivery order.', null, 500);
        }
    }

    /**
     * Update delivery order status
     */
    public function updateStatus(Request $request, $id)
    {
        $rules = [
            'status' => 'required|string|in:pending,shipped,delivered,cancelled',
            'shippedAt' => 'nullable|date',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        DB::beginTransaction();

        try {
            $validated = $validator->validated();

            $deliveryOrder = DeliveryOrder::with('items')->find($id);

            if (! $deliveryOrder) {
                return $this->apiError('Delivery order not found.', null, 404);
            }

            $deliveryOrder->status = $validated['status'];

            if ($validated['status'] === 'shipped' && isset($validated['shippedAt'])) {
                $deliveryOrder->shipped_at = $validated['shippedAt'];
            } elseif ($validated['status'] === 'shipped' && ! $deliveryOrder->shipped_at) {
                $deliveryOrder->shipped_at = now();
            }

            $deliveryOrder->save();

            $payload = $this->transformDeliveryOrder($deliveryOrder);

            DB::commit();

            return $this->apiResponse(['deliveryOrder' => $payload], 'Delivery order status updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delivery order status update error: '.$e->getMessage());

            return $this->apiError('Failed to update delivery order status.', null, 500);
        }
    }

    /**
     * Calculate delivered quantities per product for a work order
     */
    private function calculateDeliveredQuantities($workOrderId): array
    {
        $deliveryOrders = DeliveryOrder::with('items')
            ->where('work_order_id', $workOrderId)
            ->get();

        $deliveredQuantities = [];

        foreach ($deliveryOrders as $delivery) {
            foreach ($delivery->items as $item) {
                if (! isset($deliveredQuantities[$item->product_id])) {
                    $deliveredQuantities[$item->product_id] = 0;
                }
                $deliveredQuantities[$item->product_id] += $item->quantity;
            }
        }

        return $deliveredQuantities;
    }

    /**
     * Check if all items have been delivered and auto-complete work order
     */
    private function checkAndCompleteWorkOrder(WorkOrder $workOrder): void
    {
        $workOrder->load(['order.orderItems', 'deliveryOrders.items']);

        $orderItems = $workOrder->order->orderItems;
        $deliveryOrders = $workOrder->deliveryOrders;

        $allDelivered = true;

        foreach ($orderItems as $orderItem) {
            $totalDelivered = $deliveryOrders->reduce(function ($sum, $delivery) use ($orderItem) {
                $deliveryItem = $delivery->items->firstWhere('product_id', $orderItem->product_id);

                return $sum + ($deliveryItem->quantity ?? 0);
            }, 0);

            if ($totalDelivered < $orderItem->quantity) {
                $allDelivered = false;
                break;
            }
        }

        if ($allDelivered && $workOrder->status !== 'completed') {
            $workOrder->status = 'completed';
            $workOrder->save();
            \Log::info('Work order auto-completed:', ['work_order_id' => $workOrder->id]);
        }
    }

    /**
     * Revert work order status if items are no longer fully delivered
     */
    private function checkAndRevertWorkOrder(WorkOrder $workOrder): void
    {
        $workOrder->load(['order.orderItems', 'deliveryOrders.items']);

        $orderItems = $workOrder->order->orderItems;
        $deliveryOrders = $workOrder->deliveryOrders;

        $allDelivered = true;

        foreach ($orderItems as $orderItem) {
            $totalDelivered = $deliveryOrders->reduce(function ($sum, $delivery) use ($orderItem) {
                $deliveryItem = $delivery->items->firstWhere('product_id', $orderItem->product_id);

                return $sum + ($deliveryItem->quantity ?? 0);
            }, 0);

            if ($totalDelivered < $orderItem->quantity) {
                $allDelivered = false;
                break;
            }
        }

        if (! $allDelivered && $workOrder->status === 'completed') {
            $workOrder->status = 'pending';
            $workOrder->save();
            \Log::info('Work order reverted to pending:', ['work_order_id' => $workOrder->id]);
        }
    }

    /**
     * Transform delivery order for API response
     */
    private function transformDeliveryOrder(DeliveryOrder $deliveryOrder): array
    {
        return [
            'id' => $deliveryOrder->id,
            'orderCode' => $deliveryOrder->order_code,
            'workOrderId' => $deliveryOrder->work_order_id,
            'orderId' => $deliveryOrder->order_id,
            'description' => $deliveryOrder->description,
            'plannedDeliveryDate' => $deliveryOrder->planned_delivery_date?->toDateString(),
            'status' => $deliveryOrder->status,
            'shippedAt' => $deliveryOrder->shipped_at?->toISOString(),
            'createdAt' => $deliveryOrder->created_at->toISOString(),
            'updatedAt' => $deliveryOrder->updated_at->toISOString(),
            'items' => $deliveryOrder->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'productId' => $item->product_id,
                    'productName' => $item->product_name,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                ];
            })->toArray(),
        ];
    }
}
