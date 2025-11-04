<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\RoleWindow;
use App\Models\Window;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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

    public function setup()
    {
        // Implement setup method jika diperlukan
        return $this->apiResponse(null, 'Setup endpoint');
    }
}
