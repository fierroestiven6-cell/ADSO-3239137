<?php

namespace App\Models;

use App\Models\Concerns\UsesUuidV4;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    use UsesUuidV4;

    protected $fillable = [
        'beneficiary_id',
        'manager_id',
        'loaned_at',
    ];

    protected function casts(): array
    {
        return [
            'loaned_at' => 'datetime',
        ];
    }

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(Beneficiary::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function loanLines(): HasMany
    {
        return $this->hasMany(LoanLine::class);
    }
}
