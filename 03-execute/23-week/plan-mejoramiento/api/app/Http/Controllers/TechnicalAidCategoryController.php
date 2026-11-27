<?php

namespace App\Http\Controllers;

use App\Models\TechnicalAidCategory;
use Illuminate\Http\JsonResponse;

class TechnicalAidCategoryController extends Controller
{
    /**
     * Display a listing of technical aid categories.
     */
    public function index(): JsonResponse
    {
        $categories = TechnicalAidCategory::query()
            ->withCount('technicalAids')
            ->orderBy('name')
            ->get();

        return response()->json([
            'items' => $categories,
        ]);
    }
}
