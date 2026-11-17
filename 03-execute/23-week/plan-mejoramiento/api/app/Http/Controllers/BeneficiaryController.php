<?php

namespace App\Http\Controllers;

use App\Models\Beneficiary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BeneficiaryController extends Controller
{
    /**
     * Display a paginated list of beneficiaries.
     */
    public function index(): JsonResponse
    {
        $beneficiaries = Beneficiary::query()
            ->orderBy('id')
            ->paginate(15);

        return response()->json($beneficiaries);
    }

    /**
     * Store a new beneficiary.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => [
                'required',
                'string',
                'max:255',
            ],
            'identification_number' => [
                'required',
                'string',
                'max:255',
                'unique:beneficiaries,identification_number',
            ],
        ]);

        $beneficiary = Beneficiary::create($validated);

        return response()->json([
            'message' => 'Beneficiary created successfully.',
            'beneficiary' => $beneficiary,
        ], 201);
    }

    /**
     * Display a specific beneficiary.
     */
    public function show(Beneficiary $beneficiary): JsonResponse
    {
        return response()->json([
            'beneficiary' => $beneficiary,
        ]);
    }

    /**
     * Update an existing beneficiary.
     */
    public function update(
        Request $request,
        Beneficiary $beneficiary
    ): JsonResponse {
        $validated = $request->validate([
            'full_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'identification_number' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('beneficiaries', 'identification_number')
                    ->ignore($beneficiary->id),
            ],
        ]);

        if ($validated === []) {
            return response()->json([
                'message' => 'At least one field must be provided for the update.',
            ], 422);
        }

        $beneficiary->update($validated);

        return response()->json([
            'message' => 'Beneficiary updated successfully.',
            'beneficiary' => $beneficiary->refresh(),
        ]);
    }

    /**
     * Prevent deleting beneficiaries.
     */
    public function destroy(Beneficiary $beneficiary): JsonResponse
    {
      
    return response()->json([
            'message' => 'Beneficiaries cannot be deleted.',
        ], 409);
    }
}