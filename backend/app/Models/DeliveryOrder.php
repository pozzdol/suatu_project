<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeliveryOrder extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'delivery_orders';

    protected $fillable = [
        'order_code',
        'work_order_id',
        'order_id',
        'description',
        'planned_delivery_date',
        'status',
        'shipped_at',
    ];

    protected $casts = [
        'planned_delivery_date' => 'date',
        'shipped_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->order_code)) {
                $model->order_code = static::generateOrderCode();
            }
        });
    }

    /**
     * Generate order code dengan format: DO-YYYYMMDD-XXX
     */
    public static function generateOrderCode(): string
    {
        $today = now();
        $dateStr = $today->format('Ymd'); // 20251217

        // Count delivery orders created today
        $count = static::withTrashed()
            ->whereDate('created_at', $today->toDateString())
            ->count();

        $sequence = str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        return "DO-{$dateStr}-{$sequence}";
    }

    /**
     * Get the work order that owns the delivery order.
     */
    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class, 'work_order_id');
    }

    /**
     * Get the order that owns the delivery order.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Get the items for the delivery order.
     */
    public function items(): HasMany
    {
        return $this->hasMany(DeliveryOrderItem::class, 'delivery_order_id');
    }
}
