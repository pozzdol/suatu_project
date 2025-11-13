<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class Window extends Model
{
    use Auditable;
    use HasFactory;
    use SoftDeletes;

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

        'data_access_id' => 'string',
        'data_isParent_id' => 'string',
        'data_order_id' => 'integer',

        'data' => 'array',
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
    public function roleWindows()
    {
        return $this->hasMany(RoleWindow::class, 'window_id', 'id');
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_windows', 'window_id', 'role_id')
            ->withPivot(['id', 'isEdit', 'isAdmin']);
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
