<?php

namespace App\Http\Controllers;

use App\Models\RoleWindow;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class RoleWindowController extends Controller
{
    use ApiResponse;
    public function index($id)
    {
        $roleWindows = RoleWindow::where('role_id', $id)->get();

        return $this->apiResponse(['role_windows' => $roleWindows], 'Role windows retrieved successfully.');
    }

    public function create(Request $request)
    {
        $items = $request->all();

        if (empty($items)) {
            return $this->apiResponse(null, 'No items to process.', 400);
        }

        $roleId = $items[0]['role_id'];

        $existing = RoleWindow::where('role_id', $roleId)->get();

        $existingByWindow = $existing->keyBy('window_id');

        $newWindowIds = collect($items)->pluck('window_id')->toArray();

        RoleWindow::where('role_id', $roleId)
            ->whereNotIn('window_id', $newWindowIds)
            ->delete();

        foreach ($items as $item) {
            $windowId = $item['window_id'];
            $isEdit = $item['isEdit'];
            $isAdmin = $item['isAdmin'];

            $record = $existingByWindow->get($windowId);

            if (!$record) {
                RoleWindow::create([
                    'role_id' => $roleId,
                    'window_id' => $windowId,
                    'isEdit' => $isEdit,
                    'isAdmin' => $isAdmin,
                ]);
            } else {
                if ($record->isEdit != $isEdit || $record->isAdmin != $isAdmin) {
                    $record->update([
                        'isEdit' => $isEdit,
                        'isAdmin' => $isAdmin,
                    ]);
                }
            }
        }

        return $this->apiResponse(null, 'Role windows synced successfully');
    }
}
