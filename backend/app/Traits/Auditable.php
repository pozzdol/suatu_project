<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    protected static function bootAuditable()
    {
        static::creating(function ($model) {
            $model->created = json_encode([
                'createdAt' => now()->toISOString(),
                'createdBy' => Auth::id(),
            ]);
        });

        static::updating(function ($model) {
            $model->updated = json_encode([
                'updatedAt' => now()->toISOString(),
                'updatedBy' => Auth::id(),
            ]);
        });

        static::deleting(function ($model) {
            $model->deleted = json_encode([
                'deletedAt' => now()->toISOString(),
                'deletedBy' => Auth::id(),
            ]);
        });
    }

    protected function deletedRow(int $status = 200): JsonResponse
    {
        return response()->json([
            'deletedAt' => now()->toISOString(),
            'deletedBy' => Auth::id(),
        ], $status);
    }

    protected function apiError(string $message = 'Something went wrong.', $data = null, int $status = 400): JsonResponse
    {
        return $this->apiResponse($data, $message, false, $status);
    }
}
