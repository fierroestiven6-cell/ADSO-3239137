<?php

namespace App\Models;

use App\Models\Concerns\UsesUuidV4;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class TechnicalAid extends Model
{
    use UsesUuidV4;

    protected $fillable = [
        'category_id',
        'name',
        'reference',
        'description',
        'image_path',
        'total_units',
        'available_units',
        'maintenance_units',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'total_units' => 'integer',
            'available_units' => 'integer',
            'maintenance_units' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TechnicalAidCategory::class);
    }
}
