<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class RawMaterialUsage extends Model
{
    use SoftDeletes;

    protected $table = 'raw_material_usage';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['order_id', 'order_item_id', 'product_id', 'raw_material_id', 'quantity_used'];

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->id)) {
                $model->id = str_replace('-', '', (string) Str::uuid());
            }
        });
    }

    /**
     * Relationship to Order
     */
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }

    /**
     * Relationship to OrderItem
     */
    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id', 'id');
    }

    /**
     * Relationship to Product
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }

    /**
     * Relationship to RawMaterial
     */
    public function rawMaterial()
    {
        return $this->belongsTo(RawMaterial::class, 'raw_material_id', 'id');
    }

    /**
     * Get WorkOrder melalui Order relationship
     * Menggunakan order_id untuk join ke work_order.order_id
     */
    public function workOrder()
    {
        return $this->hasOne(WorkOrder::class, 'order_id', 'order_id');
    }
}
