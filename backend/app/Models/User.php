<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

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
        'deleted_at' => 'datetime',
        'deleted' => 'array',
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

    protected function runSoftDelete()
    {
        $query = $this->newQueryWithoutScopes()->where($this->getKeyName(), $this->getKey());

        $time = $this->freshTimestampString();

        // Decode existing deleted data if it's a string
        $existingMeta = $this->deleted;
        if (is_string($existingMeta)) {
            $existingMeta = json_decode($existingMeta, true) ?? [];
        } elseif (!is_array($existingMeta)) {
            $existingMeta = [];
        }

        $meta = array_merge($existingMeta, [
            'deletedBy' => Auth::id() ?: null,
            'deletedMail' => Auth::user()->email ?? null,
        ]);

        $query->update([
            $this->getDeletedAtColumn() => $time,
            'deleted' => json_encode($meta),
        ]);

        // update model in memory
        $this->{$this->getDeletedAtColumn()} = $time;
        $this->setAttribute('deleted', $meta);
    }

    public function restore()
    {
        if ($this->fireModelEvent('restoring') === false) {
            return false;
        }

        $this->{$this->getDeletedAtColumn()} = null;
        $this->deleted = null;

        $result = $this->save();

        $this->fireModelEvent('restored', false);

        return $result;
    }
}
