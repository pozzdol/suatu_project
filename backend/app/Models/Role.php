<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class Role extends Model
{
    use HasFactory;
    use SoftDeletes;

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
        'data' => 'array',
        'deleted' => 'array',
        'deleted_at' => 'datetime',
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

    protected function runSoftDelete()
    {
        $query = $this->newQueryWithoutScopes()->where($this->getKeyName(), $this->getKey());

        $time = $this->freshTimestampString();

        $existingMeta = $this->deleted ?? [];

        $meta = array_merge($existingMeta, [
            'at'     => $time,
            'by'     => Auth::id() ?: null,
            'ip'     => request()->ip() ?: null,
            'reason' => $this->delete_reason ?? request('reason') ?? null,
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
