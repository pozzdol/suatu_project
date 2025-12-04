<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RawMaterial;
use App\Models\RawMaterialUsage;
use App\Models\WorkOrder;
use App\Services\LowStockNotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class OrdersController extends Controller
{
    use ApiResponse;

    protected LowStockNotificationService $lowStockNotificationService;

    public function __construct(LowStockNotificationService $lowStockNotificationService)
    {
        $this->lowStockNotificationService = $lowStockNotificationService;
    }

    public function index()
    {
        try {
            $orders = Order::with(['orderItems.product', 'workOrder'])
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->get();

            $payload = $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'name' => $order->name,
                    'email' => $order->email,
                    'phone' => $order->phone,
                    'address' => $order->address,
                    'status' => $order->status,
                    'deleted' => $order->deleted,
                    'created_at' => $order->created_at,
                    'updated_at' => $order->updated_at,
                    'orderItems' => $order->orderItems->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'productId' => $item->product_id,
                            'productName' => $item->product->data['name'] ?? '',
                            'quantity' => $item->quantity,
                        ];
                    }),
                    'workOrder' => $this->transformWorkOrder($order->workOrder),
                ];
            });

            return $this->apiResponse(['orders' => $payload], 'Orders retrieved successfully.', true, 200);
        } catch (\Exception $e) {
            Log::error('Order retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve orders.', null, 500);
        }
    }

    public function create(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:1000',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        try {
            $validated = $validator->validated();

            $workOrderDescription = $request->input('work_order_description');
            if ($workOrderDescription === null) {
                $workOrderDescription = $request->input('workOrderDescription');
            }

            $order = new Order;
            $order->name = $validated['name'];
            $order->email = $validated['email'];
            $order->phone = $validated['phone'] ?? null;
            $order->address = $validated['address'] ?? null;
            $order->status = 'draft';
            $order->save();

            $payload = [
                'id' => $order->id,
                'name' => $order->name,
                'email' => $order->email,
                'phone' => $order->phone,
                'address' => $order->address,
                'status' => $order->status,
                'deleted' => $order->deleted,
                'created_at' => $order->created_at,
                'updated_at' => $order->updated_at,
                'orderItems' => [],
                'workOrder' => $this->transformWorkOrder($order->workOrder),
            ];

            return $this->apiResponse(['order' => $payload], 'Order created successfully.', true, 201);
        } catch (\Exception $e) {
            Log::error('Order creation error: '.$e->getMessage());

            return $this->apiError('Failed to create order.', null, 500);
        }
    }

    public function show($id)
    {
        try {
            $order = Order::with(['orderItems.product', 'workOrder'])->find($id);

            if (! $order) {
                return $this->apiError('Order not found.', null, 404);
            }

            $payload = [
                'id' => $order->id,
                'name' => $order->name,
                'email' => $order->email,
                'phone' => $order->phone,
                'address' => $order->address,
                'status' => $order->status,
                'deleted' => $order->deleted,
                'created_at' => $order->created_at,
                'updated_at' => $order->updated_at,
                'orderItems' => $order->orderItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'productId' => $item->product_id,
                        'productName' => $item->product->data['name'] ?? '',
                        'quantity' => $item->quantity,
                    ];
                }),
                'workOrder' => $this->transformWorkOrder($order->workOrder),
            ];

            return $this->apiResponse(['order' => $payload], 'Order retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Order retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve order.', null, 500);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $order = Order::with(['orderItems', 'workOrder'])->find($id);

            if (! $order) {
                return $this->apiError('Order not found.', null, 404);
            }

            $rules = [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|string|email|max:255',
                'phone' => 'sometimes|nullable|string|max:50',
                'address' => 'sometimes|nullable|string|max:1000',
                'status' => 'sometimes|required|string|in:draft,confirm',
                'orderItems' => 'sometimes|required|array|min:1',
                'orderItems.*.productId' => 'required|string|exists:product,id',
                'orderItems.*.quantity' => 'required|integer|min:1',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $validated = $validator->validated();

            $workOrderDescription = $request->input('work_order_description');
            if ($workOrderDescription === null) {
                $workOrderDescription = $request->input('workOrderDescription');
            }

            $originalStatus = $order->status;
            $targetStatus = $originalStatus;

            if (array_key_exists('status', $validated)) {
                $targetStatus = $validated['status'];
            }

            if ($originalStatus === 'confirm') {
                $this->revertRawMaterialUsage($order);
            }

            if (isset($validated['name'])) {
                $order->name = $validated['name'];
            }
            if (isset($validated['email'])) {
                $order->email = $validated['email'];
            }
            if (array_key_exists('phone', $validated)) {
                $order->phone = $validated['phone'];
            }
            if (array_key_exists('address', $validated)) {
                $order->address = $validated['address'];
            }

            if (isset($validated['orderItems'])) {
                $newProductIds = collect($validated['orderItems'])->pluck('productId')->toArray();

                OrderItem::withTrashed()
                    ->where('order_id', $order->id)
                    ->whereNotIn('product_id', $newProductIds)
                    ->forceDelete();

                foreach ($validated['orderItems'] as $item) {
                    $existingItem = OrderItem::withTrashed()
                        ->where('order_id', $order->id)
                        ->where('product_id', $item['productId'])
                        ->first();

                    if ($existingItem) {
                        if ($existingItem->trashed()) {
                            $existingItem->restore();
                        }
                        $existingItem->quantity = $item['quantity'];
                        $existingItem->save();
                    } else {
                        $orderItem = new OrderItem;
                        $orderItem->order_id = $order->id;
                        $orderItem->product_id = $item['productId'];
                        $orderItem->quantity = $item['quantity'];
                        $orderItem->save();
                    }
                }

                $order->load('orderItems.product');
            }

            if ($targetStatus === 'confirm') {
                $order->load('orderItems.product');

                if ($order->orderItems->isEmpty()) {
                    DB::rollBack();

                    return $this->apiError(
                        'Cannot confirm order without order items.',
                        null,
                        422
                    );
                }

                $availabilityCheck = $this->checkRawMaterialAvailability($order);

                if (! $availabilityCheck['available']) {
                    DB::rollBack();

                    return $this->apiError(
                        'Raw material tidak tersedia.',
                        ['insufficient_materials' => $availabilityCheck['insufficient']],
                        422
                    );
                }

                $usedRawMaterialIds = $this->processRawMaterialUsage($order);
                $this->createOrRestoreWorkOrder($order, $workOrderDescription);

                // Check and send low stock notification after raw material deducted
                if (!empty($usedRawMaterialIds)) {
                    $this->lowStockNotificationService->checkAndNotify($usedRawMaterialIds);
                }
            }

            if ($targetStatus !== 'confirm' && $originalStatus === 'confirm') {
                $this->softDeleteWorkOrder($order);
            }

            $order->status = $targetStatus;
            $order->save();

            $order->load(['orderItems.product', 'workOrder']);

            $payload = [
                'id' => $order->id,
                'name' => $order->name,
                'email' => $order->email,
                'phone' => $order->phone,
                'address' => $order->address,
                'status' => $order->status,
                'deleted' => $order->deleted,
                'created_at' => $order->created_at,
                'updated_at' => $order->updated_at,
                'orderItems' => $order->orderItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'productId' => $item->product_id,
                        'productName' => $item->product->data['name'] ?? '',
                        'quantity' => $item->quantity,
                    ];
                }),
                'workOrder' => $this->transformWorkOrder($order->workOrder),
            ];

            DB::commit();

            return $this->apiResponse(['order' => $payload], 'Order updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order update error: '.$e->getMessage());

            return $this->apiError('Failed to update order.', null, 500);
        }
    }

    /**
     * Delete single order (soft delete)
     * ID bisa dari URL parameter atau dari body
     */
    public function destroy(Request $request, $id = null)
    {
        DB::beginTransaction();

        try {
            $orderId = $id ?? $request->input('id');

            if (! $orderId) {
                return $this->apiError('Order ID is required.', null, 422);
            }

            $order = Order::find($orderId);

            if (! $order) {
                return $this->apiError('Order not found.', null, 404);
            }

            $this->revertRawMaterialUsage($order);
            $this->softDeleteWorkOrder($order);

            $order->delete();

            DB::commit();

            return $this->apiResponse(null, 'Order deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete order.', null, 500);
        }
    }

    /**
     * Mass delete orders (soft delete)
     * Expects array of IDs in body: { "ids": ["id1", "id2", ...] }
     */
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

            foreach ($validated['ids'] as $orderId) {
                $order = Order::find($orderId);

                if ($order) {
                    $this->revertRawMaterialUsage($order);
                    $this->softDeleteWorkOrder($order);
                    $order->delete();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $orderId;
                }
            }

            $message = "{$deletedCount} order(s) deleted successfully.";
            if (! empty($notFoundIds)) {
                $message .= ' Not found: '.implode(', ', $notFoundIds);
            }

            DB::commit();

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Mass order deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete orders.', null, 500);
        }
    }

    /**
     * Format work order payload for API responses.
     */
    private function transformWorkOrder(?WorkOrder $workOrder): ?array
    {
        if (! $workOrder) {
            return null;
        }

        return [
            'id' => $workOrder->id,
            'orderId' => $workOrder->order_id,
            'noSurat' => $workOrder->no_surat,
            'description' => $workOrder->description,
            'status' => $workOrder->status,
            'deleted' => $workOrder->deleted,
            'deleted_at' => $workOrder->deleted_at,
            'created_at' => $workOrder->created_at,
            'updated_at' => $workOrder->updated_at,
        ];
    }

    /**
     * Ensure a work order exists (or is restored) when order has been confirmed.
     */
    private function createOrRestoreWorkOrder(Order $order, ?string $description = null): void
    {
        $relation = $order->workOrder();
        $existing = $relation->withTrashed()->first();

        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
            }

            if ($description !== null) {
                $existing->description = $description;
            }

            if ($existing->status === null) {
                $existing->status = 'pending';
            }

            $existing->save();
            $order->setRelation('workOrder', $existing);

            return;
        }

        $workOrder = WorkOrder::create([
            'order_id' => $order->id,
            'description' => $description,
            'status' => 'pending',
        ]);

        $order->setRelation('workOrder', $workOrder);
    }

    /**
     * Soft delete the related work order when order is reverted or deleted.
     */
    private function softDeleteWorkOrder(Order $order): void
    {
        $workOrder = $order->workOrder;

        if (! $workOrder) {
            $workOrder = $order->workOrder()->withTrashed()->first();
        }

        if ($workOrder && ! $workOrder->trashed()) {
            $workOrder->delete();
        }

        if ($workOrder && $workOrder->trashed()) {
            $order->setRelation('workOrder', null);
        }
    }

    /**
     * Cek ketersediaan raw material untuk semua order items
     */
    private function checkRawMaterialAvailability(Order $order): array
    {
        $order->load('orderItems.product');

        $requiredMaterials = [];

        foreach ($order->orderItems as $orderItem) {
            $product = $orderItem->product;
            $ingredients = $product->data['ingredients'] ?? [];

            foreach ($ingredients as $ingredient) {
                $rawMaterialId = $ingredient['rawMaterialId'];
                $quantityNeeded = $ingredient['quantity'] * $orderItem->quantity;

                if (! isset($requiredMaterials[$rawMaterialId])) {
                    $requiredMaterials[$rawMaterialId] = 0;
                }
                $requiredMaterials[$rawMaterialId] += $quantityNeeded;
            }
        }

        $insufficient = [];
        $available = true;

        foreach ($requiredMaterials as $rawMaterialId => $quantityNeeded) {
            $rawMaterial = RawMaterial::find($rawMaterialId);

            if (! $rawMaterial) {
                $insufficient[] = [
                    'rawMaterialId' => $rawMaterialId,
                    'rawMaterialName' => 'Unknown',
                    'required' => $quantityNeeded,
                    'available' => 0,
                    'shortage' => $quantityNeeded,
                ];
                $available = false;

                continue;
            }

            $currentStock = $rawMaterial->data['stock'] ?? 0;

            if ($currentStock < $quantityNeeded) {
                $insufficient[] = [
                    'rawMaterialId' => $rawMaterialId,
                    'rawMaterialName' => $rawMaterial->data['name'] ?? 'Unknown',
                    'required' => $quantityNeeded,
                    'available' => $currentStock,
                    'shortage' => $quantityNeeded - $currentStock,
                ];
                $available = false;
            }
        }

        return [
            'available' => $available,
            'insufficient' => $insufficient,
            'requiredMaterials' => $requiredMaterials,
        ];
    }

    /**
     * Mengembalikan stok raw material dan menghapus catatan penggunaan order.
     */
    private function revertRawMaterialUsage(Order $order): void
    {
        $usages = RawMaterialUsage::where('order_id', $order->id)->get();

        foreach ($usages as $usage) {
            $rawMaterial = RawMaterial::find($usage->raw_material_id);

            if ($rawMaterial) {
                $data = $rawMaterial->data ?? [];
                $currentStock = $data['stock'] ?? 0;
                $data['stock'] = $currentStock + (float) $usage->quantity_used;
                $rawMaterial->data = $data;
                $rawMaterial->save();
            }

            $usage->forceDelete();
        }
    }

    /**
     * Proses penggunaan raw material: kurangi stock dan catat history
     * @return array Array of raw material IDs that were used
     */
    private function processRawMaterialUsage(Order $order): array
    {
        $order->load('orderItems.product');

        $usedRawMaterialIds = [];

        foreach ($order->orderItems as $orderItem) {
            $product = $orderItem->product;
            $ingredients = $product->data['ingredients'] ?? [];

            foreach ($ingredients as $ingredient) {
                $rawMaterialId = $ingredient['rawMaterialId'];
                $quantityUsed = $ingredient['quantity'] * $orderItem->quantity;

                $rawMaterial = RawMaterial::find($rawMaterialId);
                if ($rawMaterial) {
                    $data = $rawMaterial->data ?? [];
                    $currentStock = $data['stock'] ?? 0;
                    $data['stock'] = max(0, $currentStock - $quantityUsed);
                    $rawMaterial->data = $data;
                    $rawMaterial->save();

                    RawMaterialUsage::create([
                        'order_id' => $order->id,
                        'order_item_id' => $orderItem->id,
                        'product_id' => $product->id,
                        'raw_material_id' => $rawMaterialId,
                        'quantity_used' => $quantityUsed,
                    ]);

                    // Collect used raw material IDs
                    if (!in_array($rawMaterialId, $usedRawMaterialIds)) {
                        $usedRawMaterialIds[] = $rawMaterialId;
                    }
                }
            }
        }

        return $usedRawMaterialIds;
    }
}
