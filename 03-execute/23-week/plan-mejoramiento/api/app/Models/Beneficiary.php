<?php

namespace App\Models;

use App\Models\Concerns\UsesUuidV4;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['full_name', 'identification_number'])]
class Beneficiary extends Model
{
    use UsesUuidV4;

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }
}
