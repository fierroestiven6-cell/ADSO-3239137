<?php

namespace App\Http\Controllers;

use App\Models\Beneficiary;
use App\Models\Loan;
use App\Models\LoanLine;
use App\Models\TechnicalAid;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function summary(): JsonResponse
    {
        $technicalAids = TechnicalAid::query()
            ->where('is_active', true);

        return response()->json([
            'loans_count' => Loan::count(),

            'returns_count' => LoanLine::whereNotNull('returned_at')
                ->count(),

            'beneficiaries_count' => Beneficiary::count(),

            'technical_aids_count' => (clone $technicalAids)->count(),

            'total_units' => (int) (clone $technicalAids)
                ->sum('total_units'),

            'available_units' => (int) (clone $technicalAids)
                ->sum('available_units'),

            'borrowed_units' => LoanLine::whereNull('returned_at')
                ->count(),
        ]);
    }
}
