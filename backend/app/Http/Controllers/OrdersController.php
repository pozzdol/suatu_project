<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RawMaterial;
use App\Models\RawMaterialUsage;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class OrdersController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $orders = Order::with('orderItems.product')
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

            $order = new Order;
            $order->name = $validated['name'];
            $order->email = $validated['email'];
            $order->phone = $validated['phone'] ?? null;
            $order->address = $validated['address'] ?? null;
            $order->status = 'draft'; // Default status saat create
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
            $order = Order::with('orderItems.product')->find($id);

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
            $order = Order::with('orderItems')->find($id);

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

            // Update order fields
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

            // Update order items if provided (SEBELUM cek status confirm)
            if (isset($validated['orderItems'])) {
                $newProductIds = collect($validated['orderItems'])->pluck('productId')->toArray();

                // Force delete order items yang tidak ada di request baru (termasuk soft deleted)
                OrderItem::withTrashed()
                    ->where('order_id', $order->id)
                    ->whereNotIn('product_id', $newProductIds)
                    ->forceDelete();

                // Update atau create order items
                foreach ($validated['orderItems'] as $item) {
                    // Cek apakah ada record (termasuk soft deleted)
                    $existingItem = OrderItem::withTrashed()
                        ->where('order_id', $order->id)
                        ->where('product_id', $item['productId'])
                        ->first();

                    if ($existingItem) {
                        // Jika ada (termasuk soft deleted), restore dan update
                        if ($existingItem->trashed()) {
                            $existingItem->restore();
                        }
                        $existingItem->quantity = $item['quantity'];
                        $existingItem->save();
                    } else {
                        // Jika tidak ada, create baru
                        $orderItem = new OrderItem;
                        $orderItem->order_id = $order->id;
                        $orderItem->product_id = $item['productId'];
                        $orderItem->quantity = $item['quantity'];
                        $orderItem->save();
                    }
                }

                // Reload order items setelah update
                $order->load('orderItems.product');
            }

            // Cek status SETELAH order items diupdate
            if (isset($validated['status'])) {
                // Jika status berubah ke 'confirm', cek ketersediaan raw material
                if ($validated['status'] === 'confirm' && $order->status !== 'confirm') {
                    // Pastikan order items sudah di-load
                    if (! $order->relationLoaded('orderItems')) {
                        $order->load('orderItems.product');
                    }

                    // Cek apakah ada order items
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

                    // Kurangi stock raw material dan catat history
                    $this->processRawMaterialUsage($order);
                }

                $order->status = $validated['status'];
            }
            $order->save();

            // Reload with relations untuk response
            $order->load('orderItems.product');

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
        try {
            // Prioritaskan ID dari URL, fallback ke body
            $orderId = $id ?? $request->input('id');

            if (! $orderId) {
                return $this->apiError('Order ID is required.', null, 422);
            }

            $order = Order::find($orderId);

            if (! $order) {
                return $this->apiError('Order not found.', null, 404);
            }

            $order->delete();

            return $this->apiResponse(null, 'Order deleted successfully.');
        } catch (\Exception $e) {
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

        try {
            $deletedCount = 0;
            $notFoundIds = [];

            foreach ($validated['ids'] as $orderId) {
                $order = Order::find($orderId);

                if ($order) {
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

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            Log::error('Mass order deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete orders.', null, 500);
        }
    }

    /**
     * Cek ketersediaan raw material untuk semua order items
     */
    private function checkRawMaterialAvailability(Order $order): array
    {
        $order->load('orderItems.product');

        // Hitung total kebutuhan raw material
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

        // Cek ketersediaan
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
     * Proses penggunaan raw material: kurangi stock dan catat history
     */
    private function processRawMaterialUsage(Order $order): void
    {
        $order->load('orderItems.product');

        foreach ($order->orderItems as $orderItem) {
            $product = $orderItem->product;
            $ingredients = $product->data['ingredients'] ?? [];

            foreach ($ingredients as $ingredient) {
                $rawMaterialId = $ingredient['rawMaterialId'];
                $quantityUsed = $ingredient['quantity'] * $orderItem->quantity;

                // Kurangi stock raw material
                $rawMaterial = RawMaterial::find($rawMaterialId);
                if ($rawMaterial) {
                    $data = $rawMaterial->data ?? [];
                    $currentStock = $data['stock'] ?? 0;
                    $data['stock'] = max(0, $currentStock - $quantityUsed);
                    $rawMaterial->data = $data;
                    $rawMaterial->save();

                    // Catat history penggunaan
                    RawMaterialUsage::create([
                        'order_id' => $order->id,
                        'order_item_id' => $orderItem->id,
                        'product_id' => $product->id,
                        'raw_material_id' => $rawMaterialId,
                        'quantity_used' => $quantityUsed,
                    ]);
                }
            }
        }
    }
}
