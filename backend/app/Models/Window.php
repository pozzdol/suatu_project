<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Window extends Model
{
    use HasFactory;

    protected $table = 'windows';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['id', 'created', 'updated', 'deleted', 'data'];

    protected $casts = [
        'created' => 'array',
        'updated' => 'array',
        'deleted' => 'array',
        'data'    => 'array',
        // kolom generated dari DB akan dibaca sebagai string biasa:
        'data_access_id'  => 'string',
        'data_isParent_id' => 'string',
        'data_order_id'   => 'string',
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
    public function roleWindows()
    {
        return $this->hasMany(RoleWindow::class, 'window_id', 'id');
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_windows', 'window_id', 'role_id')
            ->withPivot(['id', 'isEdit', 'isAdmin']);
    }
}
