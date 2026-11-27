<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BeneficiaryController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TechnicalAidCategoryController;
use App\Http\Controllers\TechnicalAidController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Authentication Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register'])
    ->name('register');

Route::post('/login', [AuthController::class, 'login'])
    ->name('login');

/*
|--------------------------------------------------------------------------
| Password Recovery Routes
|--------------------------------------------------------------------------
*/

Route::post('/password/forgot', [AuthController::class, 'forgotPassword'])
    ->name('password.forgot');

Route::post('/password/reset', [AuthController::class, 'resetPassword'])
    ->name('password.reset');

/*
|--------------------------------------------------------------------------
| Protected API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('logout');

    Route::get('/user', function (Request $request) {
        return $request->user();
    })->name('user');

    /*
    |--------------------------------------------------------------------------
    | Beneficiaries Management
    |--------------------------------------------------------------------------
    */

    Route::apiResource('beneficiaries', BeneficiaryController::class);

    /*
    |--------------------------------------------------------------------------
    | Technical Aid Categories
    |--------------------------------------------------------------------------
    */

    Route::get('/technical-aid-categories', [TechnicalAidCategoryController::class, 'index'])
        ->name('technical-aid-categories.index');

    /*
    |--------------------------------------------------------------------------
    | Technical Aids Management
    |--------------------------------------------------------------------------
    */

    Route::apiResource('technical-aids', TechnicalAidController::class)
        ->parameters([
            'technical-aids' => 'technicalAid',
        ]);

    /*
    |--------------------------------------------------------------------------
    | Loan Management
    |--------------------------------------------------------------------------
    */

    Route::get('/loans/overdue', [LoanController::class, 'overdue'])
        ->name('loans.overdue');

    Route::apiResource('loans', LoanController::class)
        ->only(['index', 'store', 'show']);

    Route::post('/loans/{loanId}/items/{itemId}/return', [LoanController::class, 'returnLine'])
        ->name('loans.items.return');

    /*
    |--------------------------------------------------------------------------
    | Technical Aid Maintenance
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/technical-aids/{technicalAidId}/maintenance/complete',
        [LoanController::class, 'completeMaintenance']
    )->name('technical-aids.maintenance.complete');

    /*
    |--------------------------------------------------------------------------
    | Reports Management
    |--------------------------------------------------------------------------
    */

    Route::get('/reports/summary', [ReportController::class, 'summary'])
        ->name('reports.summary');

});
