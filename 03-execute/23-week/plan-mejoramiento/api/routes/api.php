<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BeneficiaryController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\TechnicalAidController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;




Route::post('/login', [AuthController::class, 'login'])
    ->name('login');



Route::middleware('auth:sanctum')->group(function () {



    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('logout');

    Route::get('/user', function (Request $request) {
        return $request->user();
    })->name('user');

    Route::post('/users', [AuthController::class, 'createManager'])
        ->name('users.store');

    Route::apiResource('beneficiaries', BeneficiaryController::class);


    
    Route::apiResource('technical-aids', TechnicalAidController::class)
        ->parameters([
            'technical-aids' => 'technicalAid',
        ]);

   
        Route::get('/loans/overdue', [LoanController::class, 'overdue'])
        ->name('loans.overdue');

    Route::apiResource('loans', LoanController::class)
        ->only(['index', 'store', 'show']);

    Route::post('/loans/{loan}/items/{item}/return', [LoanController::class, 'returnLine'])
  
    ->name('loans.items.return');
});
