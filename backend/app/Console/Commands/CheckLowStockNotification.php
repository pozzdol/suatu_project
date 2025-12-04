<?php

namespace App\Console\Commands;

use App\Models\RawMaterial;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckLowStockNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notification:check-low-stock {--threshold=500 : Minimum stock threshold}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check raw materials with low stock and send email notifications automatically';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $threshold = $this->option('threshold');

        $this->info("Checking raw materials with stock below {$threshold}...");

        // Get low stock materials
        $lowStockMaterials = RawMaterial::whereNull('deleted_at')
            ->whereRaw("CAST(JSON_EXTRACT(data, '$.stock') AS UNSIGNED) < ?", [$threshold])
            ->get();

        if ($lowStockMaterials->isEmpty()) {
            $this->info('No low stock materials found. No notifications sent.');
            return Command::SUCCESS;
        }

        $this->info("Found {$lowStockMaterials->count()} material(s) with low stock.");

        // Get users who should receive notifications (users with notification_enabled = true or specific role)
        $users = User::whereNull('deleted_at')
            ->where(function ($query) {
                $query->where('receive_stock_notification', true)
                    ->orWhereRaw("JSON_EXTRACT(data, '$.receive_stock_notification') = true");
            })
            ->get();

        // Fallback: if no users with notification enabled, get admin users or all users
        if ($users->isEmpty()) {
            $users = User::whereNull('deleted_at')
                ->whereNotNull('email')
                ->limit(10) // Limit to prevent spam
                ->get();
        }

        if ($users->isEmpty()) {
            $this->warn('No users found to send notifications.');
            return Command::SUCCESS;
        }

        $this->info("Sending notifications to {$users->count()} user(s)...");

        // Prepare material data
        $materialsData = $lowStockMaterials->map(function ($material) {
            return [
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
                Mail::send([], [], function ($message) use ($user, $materialsData, $threshold) {
                    $message->to($user->email, $user->name)
                        ->subject('⚠️ [AUTO] Peringatan: Stok Raw Material Rendah')
                        ->html($this->buildEmailContent($user, $materialsData, $threshold));
                });
                $successCount++;
                $this->line("  ✓ Sent to: {$user->email}");
            } catch (\Exception $e) {
                Log::error("Failed to send low stock notification to {$user->email}: " . $e->getMessage());
                $failedEmails[] = $user->email;
                $this->error("  ✗ Failed: {$user->email}");
            }
        }

        $this->newLine();
        $this->info("Notifications sent: {$successCount}");

        if (!empty($failedEmails)) {
            $this->warn("Failed to send to: " . implode(', ', $failedEmails));
        }

        Log::info("Low stock notification sent", [
            'materials_count' => $lowStockMaterials->count(),
            'users_notified' => $successCount,
            'failed_emails' => $failedEmails,
        ]);

        return Command::SUCCESS;
    }

    /**
     * Build HTML email content
     */
    private function buildEmailContent($user, array $materials, int $threshold): string
    {
        $materialRows = '';
        foreach ($materials as $material) {
            $stockClass = $material['stock'] < 100 ? 'color: #dc3545; font-weight: bold;' : 'color: #ffc107;';
            $materialRows .= "
                <tr>
                    <td style='padding: 12px; border-bottom: 1px solid #dee2e6;'>{$material['name']}</td>
                    <td style='padding: 12px; border-bottom: 1px solid #dee2e6; text-align: center; {$stockClass}'>{$material['stock']} {$material['unit']}</td>
                    <td style='padding: 12px; border-bottom: 1px solid #dee2e6; text-align: center;'>{$threshold} {$material['unit']}</td>
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

                    <p>Sistem mendeteksi raw material berikut memiliki stok di bawah batas minimum ({$threshold}):</p>

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
                        Email ini dikirim secara otomatis oleh sistem.<br>
                        Tanggal: " . now()->format('d M Y H:i:s') . "
                    </p>
                </div>
            </body>
            </html>
        ";
    }
}
