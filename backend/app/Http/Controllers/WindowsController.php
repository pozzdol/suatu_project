<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\RoleWindow;
use App\Models\Window;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WindowsController extends Controller
{
    use ApiResponse;

    public function menu()
    {
        try {
            $user = Auth::user();

            $role = Role::where('id', $user->role_id)->first();
            if (! $role) {
                return $this->apiError('Role not found for the user.', null, 404);
            }

            $roleWindows = RoleWindow::where('role_id', $role->id)->pluck('window_id');

            // Get all windows ordered by order field
            $windows = Window::orderBy('data_order_id', 'asc')
                ->where('deleted', null)
                ->whereIn('id', $roleWindows)
                ->get();

            // Build menu structure
            $menuList = $this->buildMenuTree($windows);

            return $this->apiResponse(['menuList' => $menuList], 'Menu retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Menu retrieval error: ' . $e->getMessage());

            return $this->apiError('Failed to retrieve menu.', null, 500);
        }
    }

    /**
     * Build hierarchical menu tree from flat data
     */
    private function buildMenuTree($windows)
    {
        $menuItems = [];
        $windowsById = $windows->keyBy('id')->toArray();

        foreach ($windows as $window) {
            $parentId = $window->data['parent'] ?? null;

            // Only add root items (no parent or parent is empty string)
            if (empty($parentId)) {
                $menuItems[] = $this->formatMenuItem($window, $windows, $windowsById);
            }
        }

        return $menuItems;
    }

    /**
     * Format single menu item with children if exists
     */
    private function formatMenuItem($window, $windows, $windowsById)
    {
        $data = $window->data;

        $menuItem = [
            'id' => $window->id,
            'name' => $data['name'] ?? '',
            'icon' => $data['icon'] ?? '',
            'order' => (int) ($data['order'] ?? 0),
            'type' => $data['type'] ?? 'window',
            'url' => $data['url'] ?? '',
        ];

        // Add subMenu jika ada children
        if ($data['isParent'] ?? false) {
            $children = $windows->filter(function ($w) use ($window) {
                return ($w->data['parent'] ?? null) === $window->id;
            })->sortBy(function ($w) {
                return $w->data['order'] ?? 0;
            });

            if ($children->isNotEmpty()) {
                $menuItem['subMenu'] = $children->map(function ($child) use ($windows, $windowsById) {
                    return $this->formatMenuItem($child, $windows, $windowsById);
                })->values()->toArray();
            } else {
                $menuItem['subMenu'] = [];
            }
        }

        return $menuItem;
    }

    public function list()
    {
        try {
            $windows = Window::where('deleted', null)
                ->orderBy('data_order_id', 'asc')
                ->get();

            $payload = $windows->map(function ($window) {
                return [
                    'id' => $window->id,
                    'created' => $window->created,
                    'updated' => $window->updated,
                    'deleted' => $window->deleted,
                    'url' => $window->data['url'] ?? '',
                    'icon' => $window->data['icon'] ?? '',
                    'name' => $window->data['name'] ?? '',
                    'type' => $window->data['type'] ?? '',
                    'order' => $window->data_order_id ?? 0,
                    'access' => $window->data['access'] ?? '',
                    'data_isParent' => $window->data['isParent'] ?? false,
                    'data_parent_id' => $window->data['parent'] ?? null,
                ];
            });

            return $this->apiResponse(['windows' => $payload], 'Windows retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Windows retrieval error: ' . $e->getMessage());

            return $this->apiError('Failed to retrieve windows.', null, 500);
        }
    }

    public function show($id)
    {
        try {
            $windows = Window::where('id', $id)
                ->where('deleted', null)
                ->first();

            if (! $windows) {
                return $this->apiError('Window not found.', null, 404);
            }

            $payload = [
                'id' => $windows->id,
                'created' => $windows->created,
                'updated' => $windows->updated,
                'deleted' => $windows->deleted,
                'url' => $windows->data['url'] ?? '',
                'icon' => $windows->data['icon'] ?? '',
                'name' => $windows->data['name'] ?? '',
                'type' => $windows->data['type'] ?? '',
                'order' => $windows->data_order_id ?? 0,
                'access' => $windows->data['access'] ?? '',
                'data_isParent' => $windows->data['isParent'] ?? false,
                'data_parent_id' => $windows->data['parent'] ?? null,
            ];

            return $this->apiResponse(['window' => $payload], 'Window retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Window retrieval error: ' . $e->getMessage());

            return $this->apiError('Failed to retrieve window.', null, 500);
        }
    }

    public function create(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'subtitle' => 'nullable|string',
            'access' => 'nullable|string|max:32',
            'order' => 'nullable|integer',
            'type' => 'nullable|string|in:group,window',
            'parent' => 'nullable|string|max:32',
            'isParent' => 'boolean',
            'icon' => 'nullable|string|max:255',
            'url' => 'nullable|string|max:255',
        ];

        $extra = array_diff(array_keys($request->all()), array_keys($rules));
        if (! empty($extra)) {
            return $this->apiError('Invalid fields: ' . implode(', ', $extra), null, 422);
        }

        $validated = Validator::make($request->all(), $rules)->validate();

        try {
            $window = new Window;
            $window->data = $validated;
            $window->save();

            return $this->apiResponse($window, 'Window created successfully.', true, 201);
        } catch (\Exception $e) {
            Log::error('Window creation error: ' . $e->getMessage());

            return $this->apiError('Failed to create window.', null, 500);
        }
    }

    public function update($id)
    {
        try {
            $window = Window::findOrFail($id);
            $validated = Validator::make(request()->all(), [
                'name' => 'required|string|max:255',
                'subtitle' => 'nullable|string',
                'access' => 'nullable|string|max:32',
                'order' => 'nullable|integer',
                'type' => 'nullable|string|in:group,window',
                'parent' => 'nullable|string|max:32',
                'isParent' => 'boolean',
                'icon' => 'nullable|string|max:255',
                'url' => 'nullable|string|max:255',
            ])->validate();

            $window->data = array_merge($window->data, $validated);
            $window->save();

            return $this->apiResponse($window, 'Window updated successfully.');
        } catch (\Exception $e) {
            Log::error('Window update error: ' . $e->getMessage());

            return $this->apiError('Failed to update window.', null, 500);
        }
    }

    /**
     * Delete single window (soft delete via Auditable trait)
     * ID bisa dari URL parameter atau dari body
     */
    public function destroy(Request $request, $id = null)
    {
        try {
            // Prioritaskan ID dari URL, fallback ke body
            $windowId = $id ?? $request->input('id');

            if (!$windowId) {
                return $this->apiError('Window ID is required.', null, 422);
            }

            $window = Window::where('id', $windowId)
                ->where('deleted', null)
                ->first();

            if (!$window) {
                return $this->apiError('Window not found.', null, 404);
            }

            // Soft delete menggunakan Auditable trait
            $user = Auth::user();
            $window->deleted = [
                'deletedAt' => now()->toDateTimeString(),
                'deletedBy' => $user->id ?? null,
                'deletedByMail' => $user->email ?? null,
            ];
            $window->save();

            return $this->apiResponse(null, 'Window deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Window deletion error: ' . $e->getMessage());

            return $this->apiError('Failed to delete window.', null, 500);
        }
    }

    /**
     * Mass delete windows (soft delete via Auditable trait)
     * Expects array of IDs in body: { "ids": ["id1", "id2", ...] }
     */
    public function massDestroy(Request $request)
    {
        // dd($request->all());
        $validated = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required|string|max:32',
        ])->validate();

        try {
            $deletedCount = 0;
            $notFoundIds = [];

            foreach ($validated['ids'] as $windowId) {
                $window = Window::where('id', $windowId)
                    ->where('deleted', null)
                    ->first();
                $user = Auth::user();

                if ($window) {
                    $window->deleted = [
                        'deletedAt' => now()->toDateTimeString(),
                        'deletedBy' => $user->id ?? null,
                        'deletedByMail' => $user->email ?? null,
                    ];
                    $window->save();
                    $deletedCount++;
                } else {
                    $notFoundIds[] = $windowId;
                }
            }

            $message = "{$deletedCount} window(s) deleted successfully.";
            if (!empty($notFoundIds)) {
                $message .= " Not found: " . implode(', ', $notFoundIds);
            }

            return $this->apiResponse([
                'deleted_count' => $deletedCount,
                'not_found' => $notFoundIds,
            ], $message);
        } catch (\Exception $e) {
            Log::error('Mass deletion error: ' . $e->getMessage());

            return $this->apiError('Failed to delete windows.', null, 500);
        }
    }

    public function parent()
    {
        try {
            $parents = Window::where('data->isParent', true)
                ->where('deleted', null)
                ->orderBy('data_order_id', 'asc')
                ->get();

            return $this->apiResponse(['parents' => $parents], 'Parent windows retrieved successfully.');
        } catch (\Exception $e) {
            Log::error('Parent windows retrieval error: ' . $e->getMessage());

            return $this->apiError('Failed to retrieve parent windows.', null, 500);
        }
    }
}
