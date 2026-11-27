<?php

namespace App\Models;

use App\Models\Concerns\UsesUuidV4;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name'])]
class TechnicalAidCategory extends Model
{
    use UsesUuidV4;

    /**
     * Get the technical aids associated with this category.
     */
    public function technicalAids(): HasMany
    {
        return $this->hasMany(TechnicalAid::class, 'category_id');
    }
}
