<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Role extends Model
{
    use HasFactory;

    protected $table = 'roles';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // tidak ada created_at/updated_at standar

    protected $fillable = ['id', 'created', 'updated', 'deleted', 'data'];

    protected $casts = [
        'created' => 'array',
        'updated' => 'array',
        'deleted' => 'array',
        'data'    => 'array',
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
    public function users()
    {
        return $this->hasMany(User::class, 'role_id', 'id');
    }

    public function roleWindows()
    {
        return $this->hasMany(RoleWindow::class, 'role_id', 'id');
    }

    // Untuk baca many-to-many; INSERT lebih aman via RoleWindow::create()
    public function windows()
    {
        return $this->belongsToMany(Window::class, 'role_windows', 'role_id', 'window_id')
            ->withPivot(['id', 'isEdit', 'isAdmin']);
    }
}
