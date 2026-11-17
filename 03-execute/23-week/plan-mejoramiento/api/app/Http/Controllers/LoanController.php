<?php

namespace App\Http\Controllers;

use App\Models\Beneficiary;
use App\Models\Loan;
use App\Models\LoanLine;
use App\Models\TechnicalAid;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanController extends Controller
{
  
public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'status' => ['nullable', 'in:open,overdue,closed'],
            'beneficiary_id' => ['nullable', 'integer', 'exists:beneficiaries,id'],
            'page' => ['nullable', 'integer', 'min:1'],
            'size' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $now = Carbon::now('UTC');

        $query = Loan::query()
            ->with(['beneficiary', 'loanLines'])
            ->when($request->filled('from'), function (Builder $query) use ($validated) {
                $query->whereDate('loaned_at', '>=', $validated['from']);
            })
            ->when($request->filled('to'), function (Builder $query) use ($validated) {
                $query->whereDate('loaned_at', '<=', $validated['to']);
            })
            ->when($request->filled('beneficiary_id'), function (Builder $query) use ($validated) {
                $query->where('beneficiary_id', $validated['beneficiary_id']);
            });

        if (($validated['status'] ?? null) === 'closed') {
            $query->whereDoesntHave('loanLines', function (Builder $lines) {
                $lines->whereNull('returned_at');
            });
        }

        if (($validated['status'] ?? null) === 'overdue') {
            $query->whereHas('loanLines', function (Builder $lines) use ($now) {
                $lines->whereNull('returned_at')
                    ->where('due_at', '<', $now);
            });
        }

        if (($validated['status'] ?? null) === 'open') {
            $query->whereHas('loanLines', function (Builder $lines) use ($now) {
                $lines->whereNull('returned_at')
                    ->where('due_at', '>=', $now);
            })->whereDoesntHave('loanLines', function (Builder $lines) use ($now) {
                $lines->whereNull('returned_at')
                    ->where('due_at', '<', $now);
            });
        }

        $size = $validated['size'] ?? 10;

        $loans = $query
            ->orderByDesc('loaned_at')
            ->paginate($size);

        $items = $loans->getCollection()->map(function (Loan $loan) use ($now) {
            return $this->formatLoan($loan, $now);
        });

        return response()->json([
            'items' => $items,
            'page' => $loans->currentPage(),
            'size' => $loans->perPage(),
            'total' => $loans->total(),
        ]);
    }

   
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'manager') {
            abort(403, 'Solo los gestores pueden registrar préstamos.');
        }

        $validated = $request->validate([
            'beneficiary_id' => [
                'required',
                'integer',
                'exists:beneficiaries,id',
            ],
            'items' => ['required', 'array', 'min:1'],
            'items.*.technical_aid_id' => [
                'required',
                'integer',
                'distinct',
                'exists:technical_aids,id',
            ],
        ]);

        $loan = DB::transaction(function () use ($validated, $request) {
            $now = Carbon::now('UTC');

            $beneficiary = Beneficiary::query()
                ->lockForUpdate()
                ->findOrFail($validated['beneficiary_id']);

            $outstandingQuery = LoanLine::query()
                ->whereHas('loan', function (Builder $query) use ($beneficiary) {
                    $query->where('beneficiary_id', $beneficiary->id);
                })
                ->whereNull('returned_at');

            $outstandingCount = (clone $outstandingQuery)->count();

            $hasOverdueItems = (clone $outstandingQuery)
                ->where('due_at', '<', $now)
                ->exists();

            if ($hasOverdueItems) {
                abort(409, 'El beneficiario tiene ayudas técnicas vencidas pendientes de devolución.');
            }

            if ($outstandingCount + count($validated['items']) > 2) {
                throw ValidationException::withMessages([
                    'items' => [
                        "El beneficiario tiene {$outstandingCount} ayudas técnicas pendientes. El máximo permitido es dos.",
                    ],
                ]);
            }

            $technicalAidIds = collect($validated['items'])
                ->pluck('technical_aid_id')
                ->sort()
                ->values();

            $technicalAids = TechnicalAid::query()
                ->whereIn('id', $technicalAidIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($technicalAids->count() !== $technicalAidIds->count()) {
                abort(404, 'Una o más ayudas técnicas no existen.');
            }

            foreach ($technicalAidIds as $technicalAidId) {
                $technicalAid = $technicalAids->get($technicalAidId);

                if (! $technicalAid->is_active) {
                    abort(404, 'Una de las ayudas técnicas no está activa.');
                }

                if ($technicalAid->available_units < 1) {
                    abort(409, 'No hay unidades disponibles para una de las ayudas técnicas solicitadas.');
                }
            }

            $loan = Loan::create([
                'beneficiary_id' => $beneficiary->id,
                'manager_id' => $request->user()->id,
                'loaned_at' => $now,
            ]);

            foreach ($technicalAidIds as $technicalAidId) {
                $technicalAid = $technicalAids->get($technicalAidId);

                $technicalAid->decrement('available_units');

                $technicalAid->refresh();
                $technicalAid->load('category');

                LoanLine::create([
                    'loan_id' => $loan->id,
                    'technical_aid_id' => $technicalAid->id,
                    'reference_snapshot' => $technicalAid->reference,
                    'category_snapshot' => $technicalAid->category->name,
                    'due_at' => $now->copy()->addDays(30),
                    'returned_at' => null,
                ]);
            }

            return $loan;
        }, 3);

        return response()->json(
            $this->formatLoan(
                $loan->load(['beneficiary', 'loanLines']),
                Carbon::now('UTC')
            ),
            201
        );
    }

    
    public function show(int $id): JsonResponse
    {
        $loan = Loan::query()
            ->with(['beneficiary', 'loanLines'])
            ->findOrFail($id);

        return response()->json(
            $this->formatLoan($loan, Carbon::now('UTC'))
        );
    }

    public function returnLine(Request $request, int $loanId, int $itemId): JsonResponse
    {
        if ($request->user()->role !== 'manager') {
            abort(403, 'Solo los gestores pueden registrar devoluciones.');
        }

        $loan = DB::transaction(function () use ($loanId, $itemId) {
            $loan = Loan::query()
                ->lockForUpdate()
                ->findOrFail($loanId);

            $loanLine = LoanLine::query()
                ->where('loan_id', $loan->id)
                ->whereKey($itemId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($loanLine->returned_at !== null) {
                abort(409, 'Esta ayuda técnica ya fue devuelta.');
            }

            $technicalAid = TechnicalAid::query()
                ->lockForUpdate()
                ->findOrFail($loanLine->technical_aid_id);

            if ($technicalAid->available_units >= $technicalAid->total_units) {
                abort(409, 'No se puede devolver la unidad porque el inventario alcanzaría un valor inválido.');
            }

            $now = Carbon::now('UTC');

            $loanLine->update([
                'returned_at' => $now,
            ]);

            $technicalAid->increment('available_units');

            return $loan;
        }, 3);

        return response()->json([
            'message' => 'La devolución se registró correctamente.',
            'loan' => $this->formatLoan(
                $loan->load(['beneficiary', 'loanLines']),
                Carbon::now('UTC')
            ),
        ]);
    }

    
    public function overdue(): JsonResponse
    {
        $now = Carbon::now('UTC');

        $items = LoanLine::query()
            ->with(['loan.beneficiary'])
            ->whereNull('returned_at')
            ->where('due_at', '<', $now)
            ->orderBy('due_at')
            ->get()
            ->map(function (LoanLine $line) use ($now) {
                return [
                    'loan_id' => $line->loan_id,
                    'item_id' => $line->id,
                    'aid_reference' => $line->reference_snapshot,
                    'beneficiary_name' => $line->loan->beneficiary->full_name,
                    'due_at' => $line->due_at->toISOString(),
                    'days_late' => (int) $line->due_at
                        ->copy()
                        ->startOfDay()
                        ->diffInDays($now->copy()->startOfDay()),
                ];
            });

        return response()->json([
            'items' => $items,
        ]);
    }


    private function formatLoan(Loan $loan, Carbon $now): array
    {
        $lines = $loan->loanLines;

        $hasOutstandingLines = $lines->contains(
            fn (LoanLine $line) => $line->returned_at === null
        );

        $hasOverdueLines = $lines->contains(
            fn (LoanLine $line) => $line->returned_at === null
                && $line->due_at->lt($now)
        );

        $status = ! $hasOutstandingLines
            ? 'closed'
            : ($hasOverdueLines ? 'overdue' : 'open');

        return [
            'id' => $loan->id,
            'beneficiary_id' => $loan->beneficiary_id,
            'beneficiary_name' => $loan->beneficiary->full_name,
            'manager_id' => $loan->manager_id,
            'loaned_at' => $loan->loaned_at->toISOString(),
            'status' => $status,
            'items' => $lines->map(function (LoanLine $line) {
                return [
                    'id' => $line->id,
                    'technical_aid_id' => $line->technical_aid_id,
                    'aid_reference' => $line->reference_snapshot,
                    'category_name' => $line->category_snapshot,
                    'due_at' => $line->due_at->toISOString(),
                    'returned_at' => $line->returned_at?->toISOString(),
                ];
            })->values(),
        ];
    }
}
