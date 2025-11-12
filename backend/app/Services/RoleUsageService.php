<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class RoleUsageService
{
    public function findUsage(string $roleId): array
    {
        $database = DB::getDatabaseName();

        // Cari semua foreign key yang mengarah ke tabel roles
        $relations = DB::select("
            SELECT TABLE_NAME, COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_NAME = 'roles'
              AND TABLE_SCHEMA = ?
        ", [$database]);

        $results = [];

        foreach ($relations as $rel) {
            $rows = DB::table($rel->TABLE_NAME)
                ->where($rel->COLUMN_NAME, $roleId)
                ->get();

            if ($rows->isNotEmpty()) {
                $results[] = [
                    'table' => $rel->TABLE_NAME,
                    'column' => $rel->COLUMN_NAME,
                    'count' => $rows->count(),
                    'data' => $rows->map(fn($r) => (array) $r)->toArray(),
                ];
            }
        }

        return [
            'role_id' => $roleId,
            'usage' => $results,
            'message' => empty($results)
                ? 'Tidak ditemukan relasi yang memakai role ini.'
                : null,
        ];
    }
}
