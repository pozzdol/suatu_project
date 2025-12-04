<?php

namespace App\Services;

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
     * @param array $rawMaterialIds Array of raw material IDs that were used
     * @return array Result of notification process
     */
    public function checkAndNotify(array $rawMaterialIds): array
    {
        // Get raw materials with low stock from the used materials
        $lowStockMaterials = RawMaterial::whereIn('id', $rawMaterialIds)
            ->whereNull('deleted_at')
            ->get()
            ->filter(function ($material) {
                $stock = $material->data['stock'] ?? 0;
                return $stock < $this->threshold;
            });

        if ($lowStockMaterials->isEmpty()) {
            return [
                'notified' => false,
                'reason' => 'No low stock materials found',
                'materials_checked' => count($rawMaterialIds),
            ];
        }

        // Get users who should receive notifications
        $users = User::whereNull('deleted_at')
            ->where('receive_stock_notification', true)
            ->get();

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

        // Send email to each user
        foreach ($users as $user) {
            try {
                Mail::send([], [], function ($message) use ($user, $materialsData) {
                    $message->to($user->email, $user->name)
                        ->subject('⚠️ Peringatan: Stok Raw Material Rendah')
                        ->html($this->buildEmailContent($user, $materialsData));
                });
                $successCount++;
            } catch (\Exception $e) {
                Log::error("Failed to send low stock notification to {$user->email}: " . $e->getMessage());
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

    /**
     * Build HTML email content
     */
    private function buildEmailContent($user, array $materials): string
    {
        $materialRows = '';
        foreach ($materials as $material) {
            $stockClass = $material['stock'] < 100 ? 'color: #dc3545; font-weight: bold;' : 'color: #ffc107;';
            $materialRows .= "
                <tr>
                    <td style='padding: 12px; border-bottom: 1px solid #dee2e6;'>{$material['name']}</td>
                    <td style='padding: 12px; border-bottom: 1px solid #dee2e6; text-align: center; {$stockClass}'>{$material['stock']} {$material['unit']}</td>
                    <td style='padding: 12px; border-bottom: 1px solid #dee2e6; text-align: center;'>{$this->threshold} {$material['unit']}</td>
                </tr>
            ";
        }

        return "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Peringatan Stok Rendah</title>
            </head>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background-color: #f8f9fa; border-radius: 8px; padding: 20px;'>
                    <h2 style='color: #dc3545; margin-top: 0;'>⚠️ Peringatan Stok Raw Material Rendah</h2>

                    <p>Halo <strong>{$user->name}</strong>,</p>

                    <p>Setelah konfirmasi order, sistem mendeteksi raw material berikut memiliki stok di bawah batas minimum ({$this->threshold}):</p>

                    <table style='width: 100%; border-collapse: collapse; background-color: white; border-radius: 4px; overflow: hidden;'>
                        <thead>
                            <tr style='background-color: #343a40; color: white;'>
                                <th style='padding: 12px; text-align: left;'>Nama Material</th>
                                <th style='padding: 12px; text-align: center;'>Stok Saat Ini</th>
                                <th style='padding: 12px; text-align: center;'>Batas Minimum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {$materialRows}
                        </tbody>
                    </table>

                    <p style='margin-top: 20px;'>Mohon segera lakukan pengadaan untuk material di atas.</p>

                    <hr style='border: none; border-top: 1px solid #dee2e6; margin: 20px 0;'>

                    <p style='font-size: 12px; color: #6c757d;'>
                        Email ini dikirim secara otomatis oleh sistem setelah order dikonfirmasi.<br>
                        Tanggal: " . now()->format('d M Y H:i:s') . "
                    </p>
                </div>
            </body>
            </html>
        ";
    }
}
