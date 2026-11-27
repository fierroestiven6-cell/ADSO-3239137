<?php

namespace App\Models;

use App\Models\Concerns\UsesUuidV4;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanLine extends Model
{
    use UsesUuidV4;

    protected $fillable = [
        'loan_id',
        'technical_aid_id',
        'reference_snapshot',
        'category_snapshot',
        'due_at',
        'returned_at',
        'return_condition',
    ];

    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function technicalAid(): BelongsTo
    {
        return $this->belongsTo(TechnicalAid::class);
    }

    public function isReturned(): bool
    {
        return $this->returned_at !== null;
    }

    public function isOverdue(): bool
    {
        return ! $this->isReturned()
            && $this->due_at->isPast();
    }
}
