<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BeneficiaryController;
use App\Http\Controllers\LoanController;
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
    | Technical Aids Management
    |--------------------------------------------------------------------------
    */

    Route::apiResource('technical-aids', TechnicalAidController::class)
        ->parameters([
            'technical-aids' => 'technicalAid',
        ]);

    /*
    |--------------------------------------------------------------------------
    | Loans and Returns Management
    |--------------------------------------------------------------------------
    */

    Route::get('/loans/overdue', [LoanController::class, 'overdue'])
        ->name('loans.overdue');

    Route::apiResource('loans', LoanController::class)
        ->only(['index', 'store', 'show']);

    Route::post('/loans/{loan}/items/{item}/return', [LoanController::class, 'returnLine'])
        ->name('loans.items.return');

});