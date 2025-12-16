<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'orders';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = true;

    protected $fillable = [
        'id',
        'name',
        'email',
        'phone',
        'address',
        'finishing',
        'tebal_plat',
        'note',
        'status',
        'date_confirm',
        'deleted',
    ];

    protected $casts = [
        'deleted' => 'array',
        'deleted_at' => 'datetime',
        'date_confirm' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // RELATIONS
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'id');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'order_items', 'order_id', 'product_id')
            ->withPivot(['id', 'quantity']);
    }

    public function workOrder()
    {
        return $this->hasOne(WorkOrder::class, 'order_id', 'id');
    }

    public function deliveryOrder()
    {
        return $this->hasOne(DeliveryOrder::class, 'order_id', 'id');
    }

    protected function runSoftDelete()
    {
        $query = $this->newQueryWithoutScopes()->where($this->getKeyName(), $this->getKey());

        $time = $this->freshTimestampString();

        $existingMeta = is_array($this->deleted) ? $this->deleted : [];

        $meta = array_merge($existingMeta, [
            'at' => $time,
            'by' => Auth::id() ?: null,
            'ip' => request()->ip() ?: null,
            'reason' => $this->delete_reason ?? request('reason') ?? null,
        ]);

        $query->update([
            $this->getDeletedAtColumn() => $time,
            'deleted' => json_encode($meta),
        ]);

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
