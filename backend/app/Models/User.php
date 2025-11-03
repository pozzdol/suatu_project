<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'users';
    protected $primaryKey = 'id';
    // pk bukan auto-increment
    public $incrementing = false;
    protected $keyType = 'string';
    // created_at & updated_at
    public $timestamps = true;

    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'role_id',
        'profile_photo_path',
        'is_active',
        'employee_id',
        'department_id',
        'organization_id',
        'created_by',
        'updated_by',
        'email_verified_at',
        'account_activated_at',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'account_activated_at' => 'datetime',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($user) {
            // generate 32 char hex (UUID tanpa dash) jika belum ada
            if (empty($user->id)) {
                $user->id = str_replace('-', '', (string) Str::uuid());
            }
        });
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'id');
    }
}
