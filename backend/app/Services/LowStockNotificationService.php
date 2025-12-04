<?php

namespace App\Services;

use App\Mail\LowStockNotification;
use App\Models\RawMaterial;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class LowStockNotificationService
{
    protected int $threshold = 500;

    /**
     * Check raw materials after order confirmed and send notification if stock < threshold
     *
     * @param  array  $rawMaterialIds  Array of raw material IDs that were used
     * @return array Result of notification process
     */
    public function checkAndNotify(array $rawMaterialIds): array
    {
        Log::info('checkAndNotify called', ['rawMaterialIds' => $rawMaterialIds]);

        // Get raw materials with low stock from the used materials
        $lowStockMaterials = RawMaterial::whereIn('id', $rawMaterialIds)
            ->whereNull('deleted_at')
            ->get()
            ->filter(function ($material) {
                $stock = $material->data['stock'] ?? 0;

                return $stock < $this->threshold;
            });

        Log::info('Low stock materials found', ['count' => $lowStockMaterials->count()]);

        if ($lowStockMaterials->isEmpty()) {
            Log::info('No low stock materials, skipping notification');

            return [
                'notified' => false,
                'reason' => 'No low stock materials found',
                'materials_checked' => count($rawMaterialIds),
            ];
        }

        // Get users who should receive notifications (SoftDeletes trait handles deleted_at automatically)
        $users = User::where('receive_stock_notification', true)->get();

        if ($users->isEmpty()) {
            Log::warning('Low stock detected but no users configured to receive notifications', [
                'low_stock_materials' => $lowStockMaterials->pluck('id')->toArray(),
            ]);

            return [
                'notified' => false,
                'reason' => 'No users configured to receive notifications',
                'low_stock_count' => $lowStockMaterials->count(),
            ];
        }

        // Prepare material data for email
        $materialsData = $lowStockMaterials->map(function ($material) {
            return [
                'id' => $material->id,
                'name' => $material->data['name'] ?? 'Unknown',
                'stock' => $material->data['stock'] ?? 0,
                'unit' => $material->data['unit'] ?? 'pcs',
            ];
        })->toArray();

        $successCount = 0;
        $failedEmails = [];

        // Send email to each user using Mailable class
        foreach ($users as $user) {
            try {
                Mail::to($user->email, $user->name)
                    ->send(new LowStockNotification($user, $materialsData, $this->threshold));
                $successCount++;
            } catch (\Exception $e) {
                Log::error("Failed to send low stock notification to {$user->email}: ".$e->getMessage());
                $failedEmails[] = $user->email;
            }
        }

        Log::info('Low stock notification sent after order confirmed', [
            'materials_count' => count($materialsData),
            'users_notified' => $successCount,
            'failed_emails' => $failedEmails,
        ]);

        return [
            'notified' => true,
            'success_count' => $successCount,
            'failed_emails' => $failedEmails,
            'low_stock_materials' => $materialsData,
        ];
    }

    /**
     * Set threshold for low stock
     */
    public function setThreshold(int $threshold): self
    {
        $this->threshold = $threshold;

        return $this;
    }
}
