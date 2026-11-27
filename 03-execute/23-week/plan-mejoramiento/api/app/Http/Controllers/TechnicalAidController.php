<?php

namespace App\Http\Controllers;

use App\Models\TechnicalAid;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TechnicalAidController extends Controller
{
    /**
     * Display active technical aids with filters and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'category_id' => [
                'nullable',
                'uuid',
                'exists:technical_aid_categories,id',
            ],
            'page' => ['sometimes', 'integer', 'min:1'],
            'size' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $page = $validated['page'] ?? 1;
        $size = $validated['size'] ?? 20;

        $query = TechnicalAid::query()
            ->with('category')
            ->where('is_active', true);

        if (!empty($validated['q'])) {
            $search = $validated['q'];

            $query->where(function ($builder) use ($search) {
                $builder->where('reference', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        $results = $query
            ->orderBy('reference')
            ->paginate($size, ['*'], 'page', $page);

        return response()->json([
            'items' => $results->items(),
            'page' => $results->currentPage(),
            'size' => $results->perPage(),
            'total' => $results->total(),
        ]);
    }

    /**
     * Display a specific active technical aid.
     */
    public function show(TechnicalAid $technicalAid): JsonResponse
    {
        if (!$technicalAid->is_active) {
            return response()->json([
                'message' => 'La ayuda técnica no existe o está inactiva.',
            ], 404);
        }

        return response()->json([
            'technical_aid' => $technicalAid->load('category'),
        ]);
    }

    /**
     * Store a new technical aid.
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'No tienes permisos para registrar ayudas técnicas.',
            ], 403);
        }

        $validated = $request->validate([
            'category_id' => [
                'required',
                'uuid',
                'exists:technical_aid_categories,id',
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'reference' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'image' => [
                'nullable',
                'image',
                'max:5120',
            ],
            'total_units' => [
                'required',
                'integer',
                'min:1',
            ],
            'maintenance_units' => [
                'sometimes',
                'integer',
                'min:0',
            ],
        ]);

        $maintenanceUnits = $validated['maintenance_units'] ?? 0;

        if ($maintenanceUnits > $validated['total_units']) {
            throw ValidationException::withMessages([
                'maintenance_units' => [
                    'Las unidades en mantenimiento no pueden superar el total de unidades.',
                ],
            ]);
        }

        $referenceExists = TechnicalAid::query()
            ->where('reference', $validated['reference'])
            ->where('is_active', true)
            ->exists();

        if ($referenceExists) {
            return response()->json([
                'message' => 'Ya existe una ayuda técnica activa con esta referencia.',
            ], 409);
        }

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')
                ->store('technical-aids', 'public');
        }

        try {
            $technicalAid = TechnicalAid::create([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'reference' => $validated['reference'],
                'description' => $validated['description'] ?? null,
                'image_path' => $imagePath,
                'total_units' => $validated['total_units'],
                'maintenance_units' => $maintenanceUnits,
                'available_units' => $validated['total_units'] - $maintenanceUnits,
                'is_active' => true,
            ]);
        } catch (\Throwable $exception) {
            if ($imagePath !== null) {
                Storage::disk('public')->delete($imagePath);
            }

            throw $exception;
        }

        return response()->json([
            'message' => 'Ayuda técnica registrada correctamente.',
            'technical_aid' => $technicalAid->load('category'),
        ], 201);
    }

    /**
     * Update an existing technical aid.
     */
    public function update(
        Request $request,
        TechnicalAid $technicalAid
    ): JsonResponse {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'No tienes permisos para actualizar ayudas técnicas.',
            ], 403);
        }

        if (!$technicalAid->is_active) {
            return response()->json([
                'message' => 'No se puede actualizar una ayuda técnica inactiva.',
            ], 404);
        }

        $validated = $request->validate([
            'category_id' => [
                'sometimes',
                'required',
                'uuid',
                'exists:technical_aid_categories,id',
            ],
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'reference' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],
            'image' => [
                'sometimes',
                'nullable',
                'image',
                'max:5120',
            ],
            'total_units' => [
                'sometimes',
                'required',
                'integer',
                'min:1',
            ],
            'maintenance_units' => [
                'sometimes',
                'required',
                'integer',
                'min:0',
            ],
        ]);

        if ($validated === []) {
            return response()->json([
                'message' => 'Debes proporcionar al menos un campo para actualizar.',
            ], 422);
        }

        if (isset($validated['reference'])) {
            $referenceExists = TechnicalAid::query()
                ->where('reference', $validated['reference'])
                ->where('is_active', true)
                ->where('id', '!=', $technicalAid->id)
                ->exists();

            if ($referenceExists) {
                return response()->json([
                    'message' => 'Ya existe una ayuda técnica activa con esta referencia.',
                ], 409);
            }
        }

        $oldImagePath = $technicalAid->image_path;
        $newImagePath = null;

        if ($request->hasFile('image')) {
            $newImagePath = $request->file('image')
                ->store('technical-aids', 'public');

            $validated['image_path'] = $newImagePath;
        }

        try {
            $updatedAid = DB::transaction(function () use (
                $validated,
                $technicalAid
            ) {
                $aid = TechnicalAid::query()
                    ->lockForUpdate()
                    ->findOrFail($technicalAid->id);

                $newTotalUnits = $validated['total_units']
                    ?? $aid->total_units;

                $newMaintenanceUnits = $validated['maintenance_units']
                    ?? $aid->maintenance_units;

                $borrowedUnits = $aid->total_units
                    - $aid->available_units
                    - $aid->maintenance_units;

                if ($newTotalUnits < ($borrowedUnits + $newMaintenanceUnits)) {
                    throw ValidationException::withMessages([
                        'total_units' => [
                            'El total no puede ser inferior a las unidades prestadas más las unidades en mantenimiento.',
                        ],
                    ]);
                }

                $newAvailableUnits = $newTotalUnits
                    - $borrowedUnits
                    - $newMaintenanceUnits;

                $aid->total_units = $newTotalUnits;
                $aid->maintenance_units = $newMaintenanceUnits;
                $aid->available_units = $newAvailableUnits;

                foreach ([
                    'category_id',
                    'name',
                    'reference',
                    'description',
                    'image_path',
                ] as $field) {
                    if (array_key_exists($field, $validated)) {
                        $aid->{$field} = $validated[$field];
                    }
                }

                $aid->save();

                return $aid->load('category');
            });
        } catch (\Throwable $exception) {
            if ($newImagePath !== null) {
                Storage::disk('public')->delete($newImagePath);
            }

            throw $exception;
        }

        if ($newImagePath !== null && $oldImagePath !== null) {
            Storage::disk('public')->delete($oldImagePath);
        }

        return response()->json([
            'message' => 'Ayuda técnica actualizada correctamente.',
            'technical_aid' => $updatedAid,
        ]);
    }

    /**
     * Logically deactivate a technical aid.
     */
    public function destroy(
        Request $request,
        TechnicalAid $technicalAid
    ): JsonResponse {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'No tienes permisos para desactivar ayudas técnicas.',
            ], 403);
        }

        $deactivated = DB::transaction(function () use ($technicalAid) {
            $aid = TechnicalAid::query()
                ->lockForUpdate()
                ->findOrFail($technicalAid->id);

            $hasOutstandingLoans = DB::table('loan_lines')
                ->where('technical_aid_id', $aid->id)
                ->whereNull('returned_at')
                ->exists();

            if ($hasOutstandingLoans) {
                return false;
            }

            $aid->is_active = false;
            $aid->save();

            return true;
        });

        if (!$deactivated) {
            return response()->json([
                'message' => 'No se puede desactivar una ayuda técnica con préstamos pendientes.',
            ], 409);
        }

        return response()->json([
            'message' => 'Ayuda técnica desactivada correctamente.',
        ]);
    }
}
