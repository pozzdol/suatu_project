<?php

namespace App\Traits;

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
}
