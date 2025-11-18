<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class OrganizationController extends Controller
{
    use ApiResponse;

    public function create(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'address' => 'string|max:500',
            'is_active' => 'required|boolean',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->apiError('Validation error.', $validator->errors(), 422);
        }

        try {
            $organization = new Organization;
            $organization->data = $validator->validated();
            $organization->save();

            return $this->apiResponse($organization, 'Organization created successfully.', true, 201);
        } catch (\Exception $e) {
            Log::error('Organization creation error: '.$e->getMessage());

            return $this->apiError('Failed to create organization.', null, 500);
        }
    }
}
