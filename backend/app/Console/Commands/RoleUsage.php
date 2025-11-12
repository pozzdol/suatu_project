<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RoleUsageService;

class RoleUsage extends Command
{
    protected $signature = 'role:usage {roleId}';
    protected $description = 'Cari semua tabel dan baris yang menggunakan role tertentu';

    public function handle(RoleUsageService $service)
    {
        $roleId = $this->argument('roleId');
        $result = $service->findUsage($roleId);

        $this->line(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}
