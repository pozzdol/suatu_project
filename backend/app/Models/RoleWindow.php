<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class RoleWindow extends Model
{
    use HasFactory;

    protected $table = 'role_windows';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // tabel ini tidak punya created_at/updated_at

    protected $fillable = [
        'id',
        'created',
        'updated',
        'deleted',
        'window_id',
        'role_id',
        'isEdit',
        'isAdmin',
    ];

    protected $casts = [
        'created' => 'array',
        'updated' => 'array',
        'deleted' => 'array',
        'isEdit' => 'boolean',
        'isAdmin' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->id)) {
                $model->id = str_replace('-', '', (string) Str::uuid());
            }
        });
    }

    // RELATIONS
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'id');
    }

    public function window()
    {
        return $this->belongsTo(Window::class, 'window_id', 'id');
    }
}
