<?php

namespace App\Http\Controllers;

use App\Models\RoleWindow;
use App\Traits\ApiResponse;

class RoleWindowController extends Controller
{
    use ApiResponse;
    public function index($id)
    {
        $roleWindows = RoleWindow::where('role_id', $id)->get();

        return $this->apiResponse(['role_windows' => $roleWindows], 'Role windows retrieved successfully.');
    }
}
