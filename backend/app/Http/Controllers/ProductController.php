<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $products = Product::where('deleted', null)->get();

            $payload = $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'created' => $product->created,
                    'updated' => $product->updated,
                    'deleted' => $product->deleted,
                    'name' => $product->data['name'] ?? '',
                    'description' => $product->data['description'] ?? '',
                    'ingredients' => $product->data['ingredients'] ?? [],
                ];
            });

            return $this->apiResponse(['products' => $payload], 'Products retrieved successfully.', true, 200);
        } catch (\Exception $e) {
            Log::error('Product retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve products.', null, 500);
        }
    }

    public function create(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.rawMaterialId' => 'required|string|exists:raw_material,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.01',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        try {
            $product = new Product;
            $product->data = $validator->validated();
            $product->save();

            $payload = [
                'id' => $product->id,
                'created' => $product->created,
                'updated' => $product->updated,
                'deleted' => $product->deleted,
                'name' => $product->data['name'] ?? '',
                'description' => $product->data['description'] ?? '',
                'ingredients' => $product->data['ingredients'] ?? [],
            ];

            return $this->apiResponse(['product' => $payload], 'Product created successfully.', true, 201);
        } catch (\Exception $e) {
            Log::error('Product creation error: '.$e->getMessage());

            return $this->apiError('Failed to create product.', null, 500);
        }
    }

    public function show($id)
    {
        try {
            $product = Product::find($id);

            if (! $product) {
                return $this->apiError('Product not found.', null, 404);
            }

            $payload = [
                'id' => $product->id,
                'created' => $product->created,
                'updated' => $product->updated,
                'deleted' => $product->deleted,
                'name' => $product->data['name'] ?? '',
                'description' => $product->data['description'] ?? '',
                'ingredients' => $product->data['ingredients'] ?? [],
            ];

            return $this->apiResponse(['product' => $payload], 'Product retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Product retrieval error: '.$e->getMessage());

            return $this->apiError('Failed to retrieve product.', null, 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $product = Product::find($id);

            if (! $product) {
                return $this->apiError('Product not found.', null, 404);
            }

            $rules = [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'sometimes|nullable|string|max:1000',
                'ingredients' => 'sometimes|required|array|min:1',
                'ingredients.*.rawMaterialId' => 'required|string|exists:raw_material,id',
                'ingredients.*.quantity' => 'required|numeric|min:0.01',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return $this->apiError('Validation error.', $validator->errors(), 422);
            }

            $data = $product->data ?? [];
            $validated = $validator->validated();

            $product->data = array_merge($data, $validated);
            $product->save();

            $payload = [
                'id' => $product->id,
                'created' => $product->created,
                'updated' => $product->updated,
                'deleted' => $product->deleted,
                'name' => $product->data['name'] ?? '',
                'description' => $product->data['description'] ?? '',
                'ingredients' => $product->data['ingredients'] ?? [],
            ];

            return $this->apiResponse(['product' => $payload], 'Product updated successfully.');
        } catch (\Exception $e) {
            Log::error('Product update error: '.$e->getMessage());

            return $this->apiError('Failed to update product.', null, 500);
        }
    }

    /**
     * Delete single product (soft delete)
     * ID bisa dari URL parameter atau dari body
     */
    public function destroy(Request $request, $id = null)
    {
        try {
            // Prioritaskan ID dari URL, fallback ke body
            $productId = $id ?? $request->input('id');

            if (! $productId) {
                return $this->apiError('Product ID is required.', null, 422);
            }

            $product = Product::find($productId);

            if (! $product) {
                return $this->apiError('Product not found.', null, 404);
            }

            $product->delete();

            return $this->apiResponse(null, 'Product deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Product deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete product.', null, 500);
        }
    }

    /**
     * Mass delete products (soft delete)
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

            foreach ($validated['ids'] as $productId) {
                $product = Product::find($productId);

                if ($product) {
                    $product->delete();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $productId;
                }
            }

            $message = "{$deletedCount} product(s) deleted successfully.";
            if (! empty($notFoundIds)) {
                $message .= ' Not found: '.implode(', ', $notFoundIds);
            }

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            Log::error('Mass product deletion error: '.$e->getMessage());

            return $this->apiError('Failed to delete products.', null, 500);
        }
    }
}
