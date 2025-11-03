<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    protected function apiResponse($data = null, string $message = 'Data successfully displayed.', bool $success = true, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => $success,
            'data' => $data,
            'message' => $message,
        ], $status);
    }

    protected function apiError(string $message = 'Something went wrong.', $data = null, int $status = 400): JsonResponse
    {
        return $this->apiResponse($data, $message, false, $status);
    }
}
