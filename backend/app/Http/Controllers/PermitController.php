<?php

namespace App\Http\Controllers;

use App\Models\RoleWindow;
use App\Models\Window;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PermitController extends Controller
{
    use ApiResponse;

    public function permit(string $access)
    {

        $window = Window::where('data_access_id', $access)->first();
        if (!$window) {
            return $this->apiError('Invalid permit access.', null, 404);
        }

        $user = Auth::user();
        if (!$user) {
            return $this->apiError('Unauthorized.', null, 401);
        }

        $permit = RoleWindow::where('role_id', $user->role_id)
            ->where('window_id', $window->id)
            ->first();

        if ($permit) {
            $setPermit = true;
        } else {
            $setPermit = false;
        }

        $payload = [
            'permit' => [
                'permission' => $setPermit,
                'isEditable' => $permit ? (bool)$permit->isEdit : false,
                'isAdmin'    => $permit ? (bool)$permit->isAdmin : false,
            ],
            'page' => [
                'id'     => $window->id,
                'name'   => $window->data['name'],
                'description' => $window->data['subtitle'],
                'icon' => $window->data['icon'],
                'type' => $window->data['type'],
                'order' => $window->data['order'],
                'url' => $window->data['url'],
                'isParent' =>  (bool)$window->data['isParent'],
            ],
        ];

        return $this->apiResponse($payload, 'Permit retrieved successfully.');
    }
}
