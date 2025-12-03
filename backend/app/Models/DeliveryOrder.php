<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class DeliveryOrder extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'delivery_orders';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = true;

    protected $fillable = [
        'id',
        'order_id',
        'no_surat',
        'description',
        'status',
        'shipped_at',
        'delivered_at',
        'deleted',
    ];

    protected $casts = [
        'deleted' => 'array',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }

            if (empty($model->no_surat)) {
                $model->no_surat = static::generateNoSurat();
            }
        });
    }

    /**
     * Generate no_surat dengan format: 001/SPB/XII/2025
     * SPB = Surat Pengiriman Barang
     */
    public static function generateNoSurat(): string
    {
        $now = now();
        $monthNum = (int) $now->format('m');
        $year = $now->format('Y');

        $romanMonths = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V',
            6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X',
            11 => 'XI', 12 => 'XII',
        ];

        $monthRoman = $romanMonths[$monthNum];
        $prefix = $monthRoman.'/'.$year;

        // Hitung urutan berdasarkan bulan dan tahun (termasuk yang soft deleted)
        $sequence = static::withTrashed()
            ->where('no_surat', 'like', '%/'.$prefix)
            ->count() + 1;

        return sprintf('%03d/SPB/%s/%s', $sequence, $monthRoman, $year);
    }

    // RELATIONS
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
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
